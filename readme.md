# Semeion Server

This node.js project handles the server-side things of the semeion network.

MQTT is used as the communication protocol.
Mosca is used for creating the MQTT broker.

broker.js is (obv) the mqtt broker.
controller.js controls communication to and from the semeion clients (beings).

## Install instructions
Clone project and install node modules.
Run the broker.js file and the controller.js file.
Note that mongo db needs to be installed and running for the broker to work.