#!/bin/bash
c=$1
type=$2
serverstart=$(cat server_$type.rspec | sed "s/__CLIENTS__/$c/g")
serverend="</node>"
linksstart="<link client_id=\"link0\"> <component_manager name=\"urn:publicid:IDN+wall2.ilabt.iminds.be+authority+cm\"/><interface_ref client_id=\"server:if0\"/>"
linksend="<link_type name=\"lan\"/></link>"
clients=""
links=""
echo "" > .servertmp.rspec
for i in $(seq 1 1 $c); do
    x=$(echo "25 + $i * 75" | bc -l)
    client=$(cat client_$type.rspec | sed "s/__ID__/$i/g" | sed "s/__X__/$x/g" | sed "s/__CLIENTS__/$c/g")
    clients=$clients" "$client
    link=$(cat link.rspec | sed "s/__ID__/$i/g")
    links=$links" "$link
    #serverif=$(cat serverif.rspec | sed "s/__ID__/$i/g")
    #echo $serverif >> .servertmp.rspec
done
start=$(cat base.rspec)
end="</rspec>"
#serverifs=$(cat .servertmp.rspec)
echo $start $serverstart $serverifs $serverend $clients $linksstart $links $linksend $end > $type-"$c".rspec
rm .servertmp.rspec
