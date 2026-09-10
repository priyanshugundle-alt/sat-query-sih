"""
SatQuery AI — Multi-Turn Conversational Session Store
Maintains per-session conversation history, last-used raster context,
and intent chain so judges can ask follow-up questions without
re-uploading satellite imagery.
"""

import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional


# Session TTL: 30 minutes of inactivity before expiry
SESSION_TTL_SECONDS = 1800


@dataclass
class SessionTurn:
    """A single query-response exchange in a conversation."""
    turn_index: int
    query: str
    answer: str
    intent: str
    selected_model: str
    confidence: float
    uncertainty_level: str
    audit_receipt_id: str
    latency_ms: float
    timestamp: float = field(default_factory=time.time)


@dataclass
class Session:
    """Full conversational session state for a single judge / user interaction."""
    session_id: str
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)
    turns: List[SessionTurn] = field(default_factory=list)

    # Retained raster context (no re-upload needed for follow-ups)
    last_patch_id: Optional[str] = None
    last_vh_path: Optional[str] = None
    last_vv_path: Optional[str] = None

    # Metadata for the dashboard
    total_queries: int = 0
    last_intent: str = "none"
    last_confidence: float = 0.0

    def add_turn(self, turn: SessionTurn):
        self.turns.append(turn)
        self.total_queries += 1
        self.last_intent = turn.intent
        self.last_confidence = turn.confidence
        self.last_active = time.time()

    def get_context_summary(self) -> str:
        """Returns a brief natural language summary of the conversation so far."""
        if not self.turns:
            return "No prior conversation in this session."
        last = self.turns[-1]
        summary = (
            f"Previous query was about '{last.intent}' — "
            f"answer: {last.answer[:120]}{'...' if len(last.answer) > 120 else ''}"
        )
        return summary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "last_active": self.last_active,
            "total_queries": self.total_queries,
            "last_intent": self.last_intent,
            "last_confidence": round(self.last_confidence, 4),
            "last_patch_id": self.last_patch_id,
            "turns": [
                {
                    "turn_index": t.turn_index,
                    "query": t.query,
                    "answer": t.answer,
                    "intent": t.intent,
                    "selected_model": t.selected_model,
                    "confidence": round(t.confidence, 4),
                    "uncertainty_level": t.uncertainty_level,
                    "audit_receipt_id": t.audit_receipt_id,
                    "latency_ms": round(t.latency_ms, 2),
                    "timestamp": t.timestamp,
                }
                for t in self.turns
            ]
        }


class SessionStore:
    """
    Thread-safe in-memory session store.
    Manages multi-turn conversational context for each active judge session.
    """
    def __init__(self, ttl_seconds: int = SESSION_TTL_SECONDS):
        self._sessions: Dict[str, Session] = {}
        self._lock = Lock()
        self.ttl = ttl_seconds

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------

    def create_session(self) -> Session:
        """Creates and registers a new session, returns it."""
        session_id = str(uuid.uuid4())
        session = Session(session_id=session_id)
        with self._lock:
            self._sessions[session_id] = session
        return session

    def get_or_create(self, session_id: Optional[str]) -> Session:
        """Returns an existing session or creates one with the provided session_id (or new UUID)."""
        with self._lock:
            if session_id:
                session = self._sessions.get(session_id)
                if session and not self._is_expired(session):
                    return session
                # If session_id was provided but not in store, register with provided ID
                new_session = Session(session_id=session_id)
                self._sessions[session_id] = new_session
                return new_session

            # No session_id provided: create with fresh UUID
            new_id = str(uuid.uuid4())
            new_session = Session(session_id=new_id)
            self._sessions[new_id] = new_session
            return new_session

    def get(self, session_id: str) -> Optional[Session]:
        """Returns an existing non-expired session, or None."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session and not self._is_expired(session):
                return session
        return None

    def delete(self, session_id: str) -> bool:
        """Removes a session. Returns True if it existed."""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
        return False

    def list_active(self) -> List[Dict[str, Any]]:
        """Returns lightweight metadata for all non-expired sessions."""
        self._evict_expired()
        with self._lock:
            return [
                {
                    "session_id": s.session_id,
                    "total_queries": s.total_queries,
                    "last_intent": s.last_intent,
                    "last_active": s.last_active,
                    "has_raster_context": s.last_patch_id is not None or s.last_vh_path is not None,
                }
                for s in self._sessions.values()
            ]

    def active_count(self) -> int:
        self._evict_expired()
        with self._lock:
            return len(self._sessions)

    # ------------------------------------------------------------------
    # Context helpers
    # ------------------------------------------------------------------

    def update_raster_context(
        self,
        session_id: str,
        patch_id: Optional[str] = None,
        vh_path: Optional[str] = None,
        vv_path: Optional[str] = None,
    ):
        """Updates the retained raster paths so follow-up queries can reuse them."""
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                if patch_id is not None:
                    session.last_patch_id = patch_id
                if vh_path is not None:
                    session.last_vh_path = vh_path
                if vv_path is not None:
                    session.last_vv_path = vv_path

    def resolve_raster_context(
        self,
        session_id: Optional[str],
        patch_id: Optional[str],
        vh_path: Optional[str],
        vv_path: Optional[str],
    ) -> tuple:
        """
        Resolves the raster paths to use for a query.
        Priority: explicit args > session retained context.
        Returns (patch_id, vh_path, vv_path).
        """
        if patch_id or (vh_path and vv_path):
            return patch_id, vh_path, vv_path

        if session_id:
            session = self.get(session_id)
            if session:
                return session.last_patch_id, session.last_vh_path, session.last_vv_path

        return None, None, None

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _is_expired(self, session: Session) -> bool:
        return (time.time() - session.last_active) > self.ttl

    def _evict_expired(self):
        with self._lock:
            expired = [sid for sid, s in self._sessions.items() if self._is_expired(s)]
            for sid in expired:
                del self._sessions[sid]


# Singleton instance used by the API server
SESSION_STORE = SessionStore()
