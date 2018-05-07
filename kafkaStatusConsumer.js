
/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var Kafka = require('node-rdkafka');

var protobuf = require('node-protobuf');
var fs = require('fs');
var pb = new protobuf(fs.readFileSync("./protobuf/ITSCRealData.desc"));



var consumer = new Kafka.KafkaConsumer({
  //'debug': 'all',
  'metadata.broker.list': 'localhost:9092',
  'group.id': 'kafka',
  'enable.auto.commit': false
});

var topicName = 'ITSCRealData';

//logging debug messages, if debug is enabled
consumer.on('event.log', function(log) {
  console.log(log);
});

//logging all errors
consumer.on('event.error', function(err) {
  console.error('Error from consumer');
  console.error(err);
});

//counter to commit offsets every numMessages are received
var counter = 0;
var numMessages = 5;

consumer.on('ready', function(arg) {
  console.log('consumer ready.' + JSON.stringify(arg));

  consumer.subscribe([topicName]);
  //start consuming messages
  consumer.consume();
});


consumer.on('data', function(m) {
  counter++;

  //committing offsets every numMessages
  if (counter % numMessages === 0) {
    consumer.commit(m);
  }

  result = pb.parse(m.value,'ITSCRealData',function(err,data){
        console.log(result);
  },1,0,1);
});

consumer.on('disconnected', function(arg) {
  console.log('consumer disconnected. ' + JSON.stringify(arg));
});

//starting the consumer
consumer.connect();

//stopping this example after 30s
setTimeout(function() {
  //consumer.disconnect();
}, 1000);