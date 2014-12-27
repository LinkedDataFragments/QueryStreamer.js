package org.linkeddatafragments.cqelstrain.server;

import com.google.common.collect.Maps;
import org.deri.cqels.engine.ExecContext;
import org.deri.cqels.engine.RDFStream;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;
import org.linkeddatafragments.streamsparqlcommon.irail.Result;
import org.linkeddatafragments.streamsparqlcommon.irail.TrainData;

import java.io.IOException;
import java.util.Map;

/**
 * A server that provides dynamic train data.
 * @author Ruben Taelman
 */
public class DelayStream extends DynamicData {

    private volatile boolean run = true;

    private long timeout;

    private final Map<String, String> lastDelays = Maps.newHashMap();

    public DelayStream(ExecContext context, String iri, long timeout) {
        super(context, iri, timeout);
    }

    @Override
    protected void graphAction(Graph graph) {
        if(!graph.delay.equals(lastDelays.get(graph.id)) || true) {
            stream(n(graph.id), n(Main.PREFIX_TRAIN + "delay"), n(graph.delay));
            lastDelays.put(graph.id, graph.delay);
        }
    }
}
