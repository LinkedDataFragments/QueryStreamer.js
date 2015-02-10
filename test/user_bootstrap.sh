dir=$(pwd)
cd $dir

# Copy test requirements
cp /vagrant/test/csparql-train/build/libs/csparql-train-all-1.0.jar csparql.jar
mkdir time-annotated-query
for d in bin lib measurement; do
    cp -r /vagrant/$d time-annotated-query/$d
done
cp /vagrant/package.json time-annotated-query/package.json
cd time-annotated-query
npm install
cd $dir

# Download custom LDF software forks, initialize and link
for r in Server.js Client.js N3.js; do 
    git clone https://github.com/rubensworks/$r.git
    cd $r
    npm install
    cd $dir
done
# Link Client.js -> N3.js
cd Client.js/node_modules
rm -rf n3
ln -s ../../N3.js/ n3
cd $dir

# Copy tests
cp -r /vagrant/test/tests .
chmod a+x tests/*.sh

# Initiate tests
#tests/all.sh
