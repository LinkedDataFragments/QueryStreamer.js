package org.linkeddatafragments.cqelstrain.server;

import com.google.common.collect.Maps;
import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.streamsparqlcommon.irail.Graph;

import java.util.Map;

/**
 * A server that provides dynamic train data.
 * @author Ruben Taelman
 */
public class PlatformStream extends DynamicData {

    private volatile boolean run = true;

    private long timeout;

    private final Map<String, String> lastPlatforms = Maps.newHashMap();

    public PlatformStream(ExecContext context, String iri, long timeout) {
        super(context, iri, timeout);
    }

    @Override
    protected void graphAction(Graph graph) {
        if(!graph.platform.equals(lastPlatforms.get(graph.id)) || true) {
            stream(n(graph.id), n(Main.PREFIX_TRAIN + "platform"), n(graph.platform));
            lastPlatforms.put(graph.id, graph.delay);
        }
    }
}
