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
public class Stream extends DynamicData {

    private volatile boolean run = true;

    private long timeout;
    private String type;

    private final Map<String, String> last = Maps.newHashMap();

    public Stream(ExecContext context, String type, long timeout) {
        super(context, "http://myexample.org/stream" + type, timeout);
        this.type = type;
    }

    @Override
    protected void graphAction(Graph graph) {
        String field = type.equals("delay") ? graph.delay : graph.platform;
        if(!field.equals(last.get(graph.id)) || true) {
            stream(n(graph.id), n(Main.PREFIX_TRAIN + type), n(field));
            last.put(graph.id, field);
        }
    }
}
