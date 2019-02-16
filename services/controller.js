// controller.js
const mqtt = require('mqtt')
const controller = mqtt.connect('mqtt://localhost');

var connectedSemClients = [];

/**
 * Handler for when the controller connects to the broker.
 * Subscribes to the listed channels
 */
controller.on('connect', () => {
  console.log('Controller connected to broker');
  
  controller.subscribe('sem_client/connect');
  controller.subscribe('sem_client/disconnect');
  controller.subscribe('sem_client/data');
  controller.subscribe('sem_client/climax');
});

/**
 * Handler for when the controller receives a message
 * Goes through the possible options and handles them accordingly
 */
controller.on('message', (topic, message) => {
  switch (topic) {
    case 'sem_client/connect':
      return handleSemClientConnected(message);
    case 'sem_client/disconnect':
      return handleSemClientDisconnected(message);
    case 'sem_client/data':
      return handleSemClientData(message);
    case 'sem_client/climax':
      return handleSemClientClimax(message);
  }
  console.log('No handler for topic %s', topic);
});

/**
 * Handles when a semclient connects to the system.
 * Adds its id to an array of connected clients
 *
 * @param message The message from the semclient, containing its name 
 */
function handleSemClientConnected (message) {
  var newClient = JSON.parse(message.toString());

  // Check if we already have the client registered
  if(checkExistingClient(newClient)) {
    // If yes, replace it with the new instance
    let indexOfExisting = connectedSemClients.indexOf(newClient);
    connectedSemClients[indexOfExisting] = newClient;
  } else {
    // Else, just add it to the array
    connectedSemClients.push(newClient);
  }

  console.log('New client ' + newClient.name + ' connected. Now I have');
  console.log(connectedSemClients);
}

/**
 * Handles when a semclient disconnects from the system.
 * Removes its id from the array of connected clients
 * 
 * @param message The message from the semclient, containing its name 
 */
function handleSemClientDisconnected(message) {
  var disconnectedClient = JSON.parse(message.toString());
  console.log(disconnectedClient.name + ' is disconnecting.');

  // Check if its in the connected array and delete it
  if(checkExistingClient(disconnectedClient)) {
    let indexOfExisting = connectedSemClients.findIndex(x => x.clientId == disconnectedClient.clientId);
    connectedSemClients.splice(indexOfExisting, indexOfExisting+1); // Remove from array
  }

  console.log('Now I have:');
  console.log(connectedSemClients);
}

/**
 * Handle getting a climax update from one of the semclients
 * Pass it on to the other semclients 
 * 
 * @param message The message from the semclient, containing its climax status
 */
function handleSemClientClimax(message) {
  var clientStateInfo = JSON.parse(message.toString());

  if(clientStateInfo.clientState) console.log('Client ' + clientStateInfo.clientInfo.name + ' updated its climax to %s', clientStateInfo.clientState + '. I will now tell the others.');
  controller.publish('sem_client/other_climax', clientStateInfo.clientState + '');
}

/**
 * Handle getting a data update from one of the semclients
 * At the moment, do nothing with that info
 * 
 * @param message The message from the semclient, containing its data
 */
function handleSemClientData(message) {
  var clientDataInfo = JSON.parse(message.toString());
  console.log('Got data from ' + clientDataInfo.clientInfo.name + '. It is: ' + clientDataInfo.clientData);
}

/**
 * Check if a semclient is already in the array of connected clients
 * 
 * @param clientData The data of the semclient to check
 * @return {boolean} True if already in array, false if not
 */
function checkExistingClient(clientData) {

  let existingClient = connectedSemClients.find(x => x.name === clientData.name);

  if(existingClient && existingClient != undefined) {
    return true;
  }

  return false;
}

module.exports.controller = controller;
