# DrummerScript

A simple, programmable drum sequencer written in oject-oriented JavaScript using jQuery, HandleBars, and the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). 


The Web Audio API is a powerful way to generate and control audio on the web. All audio operations occur inside the **audio context**. Basic operations are performed by **audio nodes** which are then linked together to form the **audio routing graph**. Much in the same way you would connect a guitar to an effect pedal and then to an amplifier, developers can connect audio nodes together inside the audio context.  


In ```drum_machine.js``` I start by defining the audio context: ```var context = new AudioContext();```. Everything from here on out will be built off of this audio context. 

Each sound is stored as an **Audio Object** that takes a *name* and *path* as arguments:

```javascript
var Audio = function(name, path){
  this.name = name  // something to reference the object
  this.path = path  // the path to the sound file
  this.gain = context.createGain() // create a gainNode specific to each Audio object (again using the context)
  this.gain.connect(compressor) // connect the gainNode to the compressor (explained below)
  this.pattern = {} // initialize with empty pattern object
}
```

I create a dynamics compressor with ```var compressor = context.createDynamicsCompressor()``` and then set a number of parameters for the compressor. Think of a compressor as automatic volume control; if a sound is above a certain threshold, the compressor will lower the volume by a specified *ratio* and then raise it back after a specified *release time*. The compressor is connected to the main output: ```compressor.connect(context.destination)```. 

I use the following asynchronous request to load each sound into the browser's **AudioBuffer**: 

```javascript
Audio.prototype.loadSound = function(){
  var sound = this
  var getSound = new XMLHttpRequest();
  getSound.open("GET", sound.path, true);
  getSound.responseType = "arraybuffer"; //array containing the audio data to be decoded
  getSound.onload = function(){
    context.decodeAudioData(getSound.response, function(audioBuffer){
      sound.buffer = audioBuffer; // assign decoded audio to the Audio object
    });
  }
  getSound.send();
}
```

The AudioBuffer interface represents a short audio asset residing in memory, created from an audio file using the ```context.decodeAudioData()``` method. Once decoded into this form, the audio can then be put into an **AudioBufferSourceNode** and then triggered to play:

```javascript
function playSound(audio){
  var sound = context.createBufferSource(); 
  sound.buffer = audio.buffer;
  sound.connect(audio.gain); // connect sound to Audio object's gainNode (which is connected to the compressor)
  sound.start(0); // trigger the sound
}
```

As mentioned before, each Audio object is initialized with an empty pattern object. The ```padClickListener()``` controller allows a user to manipulate each pattern by clicking the respective object's pads. For example, when the 3rd pad of an object is clicked, ```pattern[3]``` is set to ```true```. This is fundamental to the way in which the drum machine triggers the selected sounds in the pattern: We iterate through each position (1 through 16) of each audio object's pattern, triggering all sounds set to ```true``` at that position. We accomplish this with a recursive ```setTimeout()```:

```javascript
var rhythmIndex = 1; //used to keep track of position
var tempo = 100; //beats per minute (BPM)

function loop(){
  sixteenthNoteTime = 60 / tempo / 4; //16th note calculation
  timer = setTimeout(function(){ 
    playCurrentIndex()
    loop()
  }, sixteenthNoteTime*1000)  // playCurrentIndex() is triggered every 16th note
}


function playCurrentIndex(){  // plays all sounds at rhythmIndex
  for (audio in allSounds){
    var track = allSounds[audio];
    var pattern = track.pattern
    if (pattern[rhythmIndex]) {
      playSound(track)
    }
  }
  movePlayhead(rhythmIndex) // moves playhead to rhythmIndex
  progressRhythm() // adds 1 to rhythmIndex or resets to 1 if at 16
};

function progressRhythm(){ 
  if(rhythmIndex < 16){
    rhythmIndex++
  }else{
    rhythmIndex = 1
  }
}

```

That is the main gist of how the drum machine works. Feel free to message me with questions or comments. Feedback is appreciated! 

-Greg Santulli





