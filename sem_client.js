// sem_client.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://broker.hivemq.com')
var stdin = process.openStdin();

var myInfo = {'name': 'SEMCLIENT_01', 'clientId' : ''};
const states = ['IDLE', 'HAPPY', 'HAPPY_OTHER', 'SCARED', 'SCARED_OTHER', 'CURIOUS', 'CURIOUS_OTHER']; 
var state = 'IDLE';


client.on('connect', () => {
  console.log('Hello world, I am ' + myInfo.name);

  // Get ID
  myInfo.clientId = client.options.clientId;

  // Subscribe to relevant channels
  client.subscribe('sem_client/other_state');

  // Inform controllers that sem_client is connected and send this Id
  client.publish('sem_client/connect', JSON.stringify(myInfo));
});

client.on('message', (topic, message) => {
  //console.log('received message %s %s', topic, message)
  switch (topic) {
    case 'sem_client/other_state':
      return handleOtherStateRequest(message)
  }
})

stdin.addListener('data', function(d) {
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that  
  // with toString() and then trim() 
  console.log('you entered: [' + d.toString().trim() + ']');

  var string = d.toString().trim();

  if(string == 'happy') {
    state = 'HAPPY';
    sendStateUpdate();
  } else if (string == 'scared') {
    state = 'SCARED';
    sendStateUpdate();
  } else if (string == 'curious') {
    state = 'CURIOUS';
    sendStateUpdate();
  }
});

function sendStateUpdate () {
  console.log('My state is now %s', state);
  var dataToSend = JSON.stringify({clientInfo: myInfo, clientState: state})
  client.publish('sem_client/state', dataToSend);
}

function handleOtherStateRequest (message) {
  var otherState = message.toString();

  if(otherState != state) {
    state = otherState + '_OTHER';
    console.log('Recieved state update. So now my state is ' + state);
  } else {
    console.log('The others were told that I am ' + state);
  }

  setTimeout(function() {
    state = 'IDLE';
    console.log('My state is back to ' + state);
  }, 5000);

}





/**
 * Want to notify controller that garage is disconnected before shutting down
 */
function handleAppExit (options, err) {
  if (err) {
    console.log('Error: ' + err.stack)
  }

  if (options.cleanup) {
    console.log('Cleaning up...');
    client.publish('sem_client/disconnect', JSON.stringify(myInfo));
  }

  if(options.kill) {
    process.kill(process.pid, 'SIGUSR2');
  }

  if (options.exit) {
    process.exit()
  }
}

/**
 * Handle the different ways an application can shutdown
 */

process.once('SIGUSR2', handleAppExit.bind(null, {
  kill: true,
  cleanup: true
}));


process.on('exit', handleAppExit.bind(null, {
  cleanup: true
}));
process.on('SIGINT', handleAppExit.bind(null, {
  exit: true,
  cleanup: true
}));
process.on('uncaughtException', handleAppExit.bind(null, {
  exit: true,
  cleanup: true
}));

