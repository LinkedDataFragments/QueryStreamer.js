package org.linkeddatafragments.cqelstrain.client;

import org.deri.cqels.engine.ExecContext;
import org.linkeddatafragments.cqelstrain.Main;
import org.linkeddatafragments.cqelstrain.server.DynamicData;
import org.linkeddatafragments.cqelstrain.server.HttpEndpoint;
import org.linkeddatafragments.cqelstrain.server.StaticData;
import org.linkeddatafragments.cqelstrain.server.Stream;

/**
 * C-SPARQL query implementation.
 * @author Ruben Taelman
 */
public class TrainQuerier {

    public void run() {
        /*String query = "PREFIX t: <http://example.org/train#> "
                     + "SELECT ?id ?delay ?platform ?departureTime "
                     //+ "FROM NAMED <" + Main.staticFile + ">"
                     + "WHERE {"
                     + "  STREAM <http://myexample.org/streamdelay> [RANGE 1m] { ?id t:delay ?delay . } " //RANGE 1m
                     + "  STREAM <http://myexample.org/streamplatform> [RANGE 1m] { ?id t:platform ?platform } "
                     + "   " // GRAPH <" + Main.staticFile + ">
                     + "  ?id t:headSign ?headSign . "
                     + "  ?id t:routeLabel ?routeLabel . "
                     + "  ?id t:departureTime ?departureTime ."
                     + ""
                     + "} ";*/

        final ExecContext context = new ExecContext(".", false);
        new StaticData(context);
        DynamicData streamdelay = new Stream(context, "delay", Main.DATA_FREQUENCY * 1000);
        DynamicData streamplatform = new Stream(context, "platform", Main.DATA_FREQUENCY * 1000);
        /*ContinuousSelect selQuery = context.registerSelect(query);
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
        }*/
        new HttpEndpoint(context);

        new Thread(streamdelay).start();
        new Thread(streamplatform).start();
    }

}
