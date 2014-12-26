package org.linkeddatafragments.csparqltrain.client;

import eu.larkc.csparql.common.RDFTable;
import eu.larkc.csparql.common.streams.format.GenericObservable;
import eu.larkc.csparql.common.streams.format.GenericObserver;
import eu.larkc.csparql.engine.ConsoleFormatter;
import eu.larkc.csparql.engine.CsparqlEngine;
import eu.larkc.csparql.engine.CsparqlEngineImpl;
import eu.larkc.csparql.engine.CsparqlQueryResultProxy;
import org.apache.commons.logging.Log;
import org.linkeddatafragments.csparqltrain.CsparqlEngineInstrumented;
import org.linkeddatafragments.csparqltrain.Main;
import org.linkeddatafragments.csparqltrain.server.DynamicData;
import org.slf4j.LoggerFactory;

import java.text.ParseException;

/**
 * C-SPARQL query implementation.
 * @author Ruben Taelman
 */
public class TrainQuerier {

    public void run() {
        String query = "REGISTER QUERY TrainDepartures AS "
                     + "PREFIX t: <http://example.org/train#> "
                     + "SELECT ?delay ?headSign ?routeLabel ?platform ?departureTime "
                     + "FROM STREAM <http://myexample.org/stream> [RANGE 1h STEP " + Main.QUERY_FREQUENCY + "s] "
                     + "FROM <http://127.0.0.1:" + Main.PORT +"/static>"
                     + "WHERE {"
                     + "  _:id t:delay ?delay . "
                     + "  _:id t:headSign ?headSign . "
                     + "  _:id t:routeLabel ?routeLabel . "
                     + "  _:id t:platform ?platform . "
                     + "  _:id t:departureTime ?departureTime . "
                     + "} ";
        DynamicData stream = new DynamicData("http://myexample.org/stream", Main.DATA_FREQUENCY * 1000);

        CsparqlEngine engine = new CsparqlEngineInstrumented();
        engine.initialize(true);
        engine.registerStream(stream);

        final Thread t = new Thread(stream);
        t.start();

        try {
            CsparqlQueryResultProxy queryProxy = engine.registerQuery(query);
            if(Main.DEBUG) queryProxy.addObserver(new ConsoleFormatter());
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }

}
