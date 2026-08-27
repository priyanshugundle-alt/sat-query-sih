package com.satquery.observer;

import com.satquery.model.TraceEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class TraceLogger {
    private static final List<TraceObserver> observers = new ArrayList<>();
    private static final ThreadLocal<List<TraceEvent>> threadTrace = ThreadLocal.withInitial(ArrayList::new);

    public static synchronized void addObserver(TraceObserver observer) {
        observers.add(observer);
    }

    public static synchronized void removeObserver(TraceObserver observer) {
        observers.remove(observer);
    }

    public static void logEvent(String eventName, String detail, String toolName, String status) {
        TraceEvent event = new TraceEvent(
                eventName,
                detail,
                toolName,
                Instant.now().toString(),
                status
        );

        // Store in current request thread trace
        threadTrace.get().add(event);

        // Notify observers
        synchronized (observers) {
            for (TraceObserver observer : observers) {
                observer.onEvent(event);
            }
        }
    }

    public static List<TraceEvent> getThreadTrace() {
        return new ArrayList<>(threadTrace.get());
    }

    public static void clearThreadTrace() {
        threadTrace.get().clear();
    }
}
