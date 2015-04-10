#!/bin/zsh
# Plot client scalability tests.
re='^[0-9]+$'
TOCOUNT=60

echo "time csparql taquery cqels" > .scalability.data

unset matrix && typeset -A matrix
unset matrixreslines && typeset -A matrixreslines
for type in "taquery" "csparql" "cqels" ; do
    for concurrent in $(seq 1 1 20); do
        echo "Read file: $concurrent / 20"

        # Read data from files and store CPU data inside a matrix
        # We only look at files which have at least TOCOUNT data points.
        for file in $type-client-output/client-output/run-$concurrent-*.txt; do # TODO: temp
            cpulines="$(tail -n +2 $file | awk '{ print $9 }')"
            lines=$(echo $cpulines | wc -l)
            if [ $lines -ge $TOCOUNT ]; then
                while read -r line; do
                    value=${matrix[$concurrent,$type]}
                    count=${matrix[$concurrent,$type,count]}
                    if ! [[ $value =~ $re ]]; then
                      value="0"
                      count=0
                    fi
                    if [[ $line =~ $re ]]; then
                        matrix[${concurrent},${type}]=$(echo "$line + $value" | bc -l)
                        matrix[${concurrent},${type},count]=$(echo "$count + 1" | bc -l)
                    fi
                done <<< "$cpulines"
            fi
        done
    done
    
    # Average for full matrix
    for concurrent in $(seq 1 1 20); do
        value=${matrix[$concurrent,$type]}
        count=${matrix[$concurrent,$type,count]}
        if ! [[ $value =~ $re ]]; then
          # makes sure the point isn't drawn
          value="a"
        else
          value=$(echo "scale=2;$value / $count * $concurrent" | bc -l)
        fi
        matrixreslines[${concurrent},${type}]=$value
    done
done

# Push averages to temp file
data=".clientsscalability.data"
echo "Time C-SPARQL TA-Query CQELS" > $data
for concurrent in $(seq 1 1 20); do
    line=$concurrent
    for type in "csparql" "taquery" "cqels"; do
        line=$line" "${matrixreslines[$concurrent,$type]}
    done
    echo $line >> $data
done

file="scalability-clients.png"
gnuplot plotClientsScalability.gplot > $file
#rm $data
