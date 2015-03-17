#!/bin/zsh
# Plot scalability tests.
re='^[0-9]+$'

echo "clients csparq taquery" > .scalability.data
for i in $(seq 10 10 200); do
    line="$i"
    for type in "csparql" "taquery"; do
        file="$type-output/run-$i.txt"
        line="$line $(tail -n +2 $file | awk '{ sum += $9; n++ } END { if (n > 0) print sum / n; }')"
    done
    echo $line >> .scalability.data
done
gnuplot plotScalability.gplot > scalability.png

for i in 10 100 200; do
    line=""
    file="csparql-output/run-$i.txt"
    c=$(tail -n +2 $file | awk '{print $9}')
    file="taquery-output/run-$i.txt"
    t=$(tail -n +2 $file | awk '{print $9}')
    echo "csparql taquery" > .scalability-100.data
    paste -d ' ' <(echo "$c") <(echo "$t") >> .scalability-100.data
    gnuplot plotScalabilityBoxplot.gplot > scalabilityBoxplot-$i.png
done
