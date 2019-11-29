/* Uplink messages
We have two kinds of payloads: short and long. The short payload contains two
bytes. One byte for battery voltage followed by one byte for temperature.
The long payload contains the GPS coordinates (latitude, longitude, altitude) followed by
battery and temperature values.
Every message has an additional information in LoRa messages. This is the port number.
We use the port number to differ the meanings of the payloads.
Meanings of the port numbers:
202: GPS coordinates (long message), the device detected movement during sleep, but
actually is not in motion now /it was a small movement only/
203: the device is in motion, but can’t get any GPS coordinates /typically with indoor
usage/
204: GPS coordinates, the device is in
motion /continous movement detected/
205: the device is in motion, no coordinates
because the GPS is switched off by user
206: used for downlink commands
207: periodic test message (short), the
device is not in motion
211: a message containing the last the step
counts in the last 15 minutes */

function longPayloadDecoder(msg, d) {
	var out = {};
	var lat = ((d[0] << 16) | (d[1] << 8) | (d[2]));
	var lon = ((d[3] << 16) | (d[4] << 8) | (d[5]));

	out['alt'] = ((d[6] << 8) | (d[7]));

	out['bat'] = msg.substr(msg.length - 2);
	out['temp'] = msg.substr(17,3)/10;
  	out['temp'] = msg.substr(16,1) == 0 ? out['temp'] : out['temp']*-1; //prefix

	if (lat == 0 || lon == 0) {
		return false;
	}

	if ((lat & 1 << 23) != 0) {
		lat = -(1 << 24) + lat;
	}

	lat /= 1 << 23;
	lat *= 90;

	if ((lon & 1 << 23) != 0) {
		lon = -(1 << 24) + lon;
	}

	lon /= 1 << 23;
	lon *= 180;

	out['lat'] = lat;
	out['lon'] = lon;

	msg = out;

	return msg;
};

function shortPayloadDecoder(msg, d) {
	var out = {};

	out['bat'] = msg.substr(msg.length - 2);
	out['temp'] = msg.substr(17,3)/10;
  	out['temp'] = msg.substr(16,1) == 0 ? out['temp'] : out['temp']*-1; //prefix

	msg = out;

	return msg;
};

/* Representing the hex string as integers */
function hexStringToIntegers(msg, port) {
	var data = msg;
	var hex = msg.match(/.{2}/g);
	var v = [];
	for (var i = 0; i < hex.length-5; i++) {
		v.push(parseInt('0x' + hex[i]));
	}

	if (msg.length <= 6) {
		return shortPayloadDecoder(msg, v);
	}
	else if (msg.length > 6) {
		return longPayloadDecoder(msg, v);
	}

	return false;
}

var hexLongPayload = "437d3a0d6a7c007a027284";
var hexShortPayload = "021785";
var payload = hexStringToIntegers(hexLongPayload);

console.log(payload);