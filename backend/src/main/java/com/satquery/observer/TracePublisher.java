package com.satquery.observer;

import com.satquery.model.TraceEvent;

public interface TracePublisher {
    void publish(TraceEvent event);
}
