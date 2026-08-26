package com.satquery.observer;

import com.satquery.model.TraceEvent;

public interface TraceObserver {
    void onEvent(TraceEvent event);
}
