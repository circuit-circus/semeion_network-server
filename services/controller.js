// controller.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://localhost');

var connectedSemClients = [];

client.on('connect', () => {
  client.subscribe('sem_client/connect');
  client.subscribe('sem_client/disconnect');
  client.subscribe('sem_client/state');
});

client.on('message', (topic, message) => {
  switch (topic) {
    case 'sem_client/connect':
      return handleSemClientConnected(message);
    case 'sem_client/disconnect':
      return handleSemClientDisconnected(message);
    case 'sem_client/state':
      return handleSemClientState(message)
  }
  console.log('No handler for topic %s', topic)
});

function handleSemClientConnected (message) {
  var newClient = JSON.parse(message.toString());

  let existingClient = connectedSemClients.find(x => x.name === newClient.name);
  if(existingClient && existingClient != undefined) {
    let index = connectedSemClients.indexOf(existingClient);
    connectedSemClients[index] = newClient;
  } else {
    connectedSemClients.push(newClient);
  }

  console.log('New client ' + newClient.name + ' connected. Now I have');
  console.log(connectedSemClients);
}

function handleSemClientDisconnected (message) {
  var disconnectedClient = JSON.parse(message.toString());
  console.log(disconnectedClient.name + ' is disconnecting.');

  // Check if its in the connected array and delete it
  let existingClient = connectedSemClients.find(x => x.name === disconnectedClient.name);
  if(existingClient && existingClient != undefined) {
    let index = connectedSemClients.indexOf(existingClient);
    connectedSemClients.splice(index, index+1); // Remove from array
  }

  console.log('Now I have:');
  console.log(connectedSemClients);
}

function handleSemClientState (message) {
  var clientStateInfo = JSON.parse(message.toString());

  console.log('Client ' + clientStateInfo.clientInfo.name + ' updated its state to %s', clientStateInfo.clientState + '. I will now tell the others.');
  client.publish('sem_client/other_state', clientStateInfo.clientState);
}

module.exports.controller = client;
