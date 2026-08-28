package com.satquery.observer;

import com.satquery.model.TraceEvent;

public class ObserverTracePublisher implements TracePublisher {
    @Override
    public void publish(TraceEvent event) {
        TraceLogger.logEvent(
                event.getEventName(),
                event.getDetail(),
                event.getToolName(),
                event.getStatus()
        );
    }
}
