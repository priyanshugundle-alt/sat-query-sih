package com.satquery.observer;

import com.satquery.model.TraceEvent;

public class EvidenceObserver implements TraceObserver {
    @Override
    public void onEvent(TraceEvent event) {
        System.out.println("[EvidenceObserver] Telemetry audit event captured: " + event.getEventName() + " - status=" + event.getStatus());
    }
}
