package org.linkeddatafragments.streamsparqlcommon.irail;

import com.google.gson.Gson;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClientBuilder;

import java.io.IOException;
import java.io.InputStream;

/**
 * @author Ruben Taelman
 */
public class TrainData {
    private static final String ACCEPT = "application/json";
    private static TrainData _instance = null;

    private HttpClient client;

    private TrainData() {
        client = HttpClientBuilder.create().build();
    }

    public static TrainData getInstance() {
        if(_instance == null) {
            _instance = new TrainData();
        }
        return _instance;
    }

    public synchronized Result get(String apiUrl) throws IOException {
        HttpGet request = new HttpGet(apiUrl);
        request.addHeader("Accept", ACCEPT);
        HttpResponse response = client.execute(request);
        InputStream is = response.getEntity().getContent();
        String result = IOUtils.toString(is);
        is.close();
        Gson gson = new Gson();
        return gson.fromJson(result, Result.class);
    }

}
