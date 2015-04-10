#!/bin/zsh
# Plot client scalability tests.
re='^[0-9]+$'
TOCOUNT=60

echo "time csparql taquery cqels" > .scalability.data

unset matrix && typeset -A matrix
unset matrixreslines && typeset -A matrixreslines
for type in "csparql" "taquery" "cqels"; do

    # Read data from files and store CPU data inside a matrix
    # We only look at files which have at least TOCOUNT data points.
    nrFiles=$(ls -l $type-client-output/client-output/run-*.txt | wc -l)
    fileI=0
    for file in $type-client-output/client-output/run-*.txt; do
        echo "Read file: $fileI / $nrFiles"
        cpulines="$(tail -n +2 $file | awk '{ print $9 }')"
        lines=$(echo $cpulines | wc -l)
        if [ $lines -ge $TOCOUNT ]; then
            i=1
            while read -r line; do
                value=${matrix[$i,$type]}
                count=${matrix[$i,$type,count]}
                if ! [[ $value =~ $re ]]; then
                  value="0"
                  count=0
                fi
                if [[ $line =~ $re ]]; then
                    matrix[${i},${type}]=$(echo "$line + $value" | bc -l)
                    matrix[${i},${type},count]=$(echo "$count + 1" | bc -l)
                    let "i++"
                fi
            done <<< "$cpulines"
        fi
        let "fileI++"
    done
    
    # Average for full matrix
    for i in $(seq 1 1 $TOCOUNT); do
        value=${matrix[$i,$type]}
        count=${matrix[$i,$type,count]}
        if ! [[ $value =~ $re ]]; then
          # makes sure the point isn't drawn
          value="a"
        else
          value=$(echo "scale=2;$value / $count" | bc -l)
        fi
        matrixreslines[${i},${type}]=$value
    done
done

# Push averages to temp file
data=".clientscalability.data"
echo "Time C-SPARQL TA-Query CQELS" > $data
for i in $(seq 1 1 $TOCOUNT); do
    line=$(echo "$i - 1" | bc -l)
    for type in "csparql" "taquery" "cqels"; do
        line=$line" "${matrixreslines[$i,$type]}
    done
    echo $line >> $data
done

file="scalability-client.png"
gnuplot plotClientScalability.gplot > $file
#rm $data
