package org.linkeddatafragments.cqelstrain.client;

import com.hp.hpl.jena.sparql.core.Var;
import org.deri.cqels.data.Mapping;
import org.deri.cqels.engine.ContinuousListener;
import org.deri.cqels.engine.ContinuousSelect;
import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.cqelstrain.server.DelayStream;
import org.linkeddatafragments.cqelstrain.server.DynamicData;

import java.util.Iterator;

/**
 * C-SPARQL query implementation.
 * @author Ruben Taelman
 */
public class TrainQuerier {

    public void run() {
        String query = "PREFIX t: <http://example.org/train#> "
                     + "SELECT ?delay ?headSign ?routeLabel ?platform ?departureTime "
                     + "FROM NAMED <static.ttl>"
                     + "WHERE {"
                     + "  STREAM <http://myexample.org/streamdelay> [RANGE 1m] { ?id t:delay ?delay . } "
                     + "  STREAM <http://myexample.org/streamplatform> [RANGE 1m] { ?id t:platform ?platform } "
                     /*+ "  GRAPH <static.ttl> { "
                     + "  ?id t:headSign ?headSign . "
                     + "  ?id t:routeLabel ?routeLabel . "
                     + "  ?id t:departureTime ?departureTime . }"*/
                     + "} ";

        final ExecContext context = new ExecContext(".", false);
        DynamicData streamdelay = new DelayStream(context, "http://myexample.org/streamdelay", Main.DATA_FREQUENCY * 1000);
        DynamicData streamplatform = new DelayStream(context, "http://myexample.org/streamplatform", Main.DATA_FREQUENCY * 1000);
        ContinuousSelect selQuery=context.registerSelect(query);
        if(Main.DEBUG) {
            selQuery.register(new ContinuousListener() {
                public void update(Mapping mapping) {
                    String result = "";
                    for (Iterator<Var> vars = mapping.vars(); vars.hasNext(); ) {
                        //Use context.engine().decode(...) to decode the encoded value to RDF Node
                        long id = mapping.get(vars.next());
                        if(id >= 0) {
                            result += " " + context.engine().decode(id);
                        }
                    }
                    System.out.println(result);
                }
            });
        }

        new Thread(streamdelay).start();
        new Thread(streamplatform).start();
    }

}
