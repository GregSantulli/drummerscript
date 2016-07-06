

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var Audio = function(name, path){
  this.name = name
  this.path = path
  this.gain = context.createGain()
  this.gain.gain.value = .6
  this.gain.connect(context.destination)
  this.pattern = {}
}

Audio.prototype.loadSound = function(){
  var sound = this
  var getSound = new XMLHttpRequest();
  getSound.open("GET", sound.path, true);
  getSound.responseType = "arraybuffer";
  getSound.onload = function(){
    context.decodeAudioData(getSound.response, function(audioBuffer){
      sound.buffer = audioBuffer;
    });
  }
  getSound.send();
}

var allSounds = {
  tomHi: new Audio('tomHi', 'sounds/TOM-HI.wav'),
  tomLo: new Audio('tomLo', 'sounds/TOM-LO.wav'),
  clav: new Audio('clav', 'sounds/CLAV.wav'),
  hatOpen: new Audio('hatOpen', 'sounds/HAT-OPEN.wav'),
  hatClosed: new Audio('hatClosed', 'sounds/HAT-CLOSED.wav'),
  clap: new Audio('clap', 'sounds/CLAP.wav'),
  snare: new Audio('snare', 'sounds/SNARE.wav'),
  kickHi: new Audio('kickHi', 'sounds/KICK-HI.wav'),
  kickLo: new Audio('kickLo', 'sounds/KICK-LO.wav'),
}

var tempo = 95;
var rhythmIndex = 1;
var playing = false;
var sixteenthNoteTime;
var timer;
var gate = 1;
var noteGain = .1;


var arp = {
 1: {},
 2: {},
 3: {},
 4: {},
 5: {},
 6: {},
 7: {},
 8: {},
 9: {},
 10: {},
 11: {},
 12: {},
 13: {},
};

var arpShape = "sawtooth"

var scale = {
  1: 261.63,
  2: 277.18,
  3: 293.66,
  4: 311.13,
  5: 329.63,
  6: 349.23,
  7: 369.99,
  8: 392.00,
  9: 415.30,
  10: 440.00,
  11:466.16,
  12: 493.88,
  13: 523.25
};





function loadAllSounds(){
  for (sound in allSounds) {
    allSounds[sound].loadSound()
  }
}


function playSound(audio){
  var sound = context.createBufferSource();
  sound.buffer = audio.buffer;
  sound.connect(audio.gain);
  sound.start(0);
  var trackLabel = $('.instrument_label.'+audio.name).parent()
  animateElement(trackLabel)
}

var playing;



function play(){
  if(!playing){
    loop();
    playing = true;
    toggleButton()
  }else{
    rhythmIndex = 1
  }
};

function loop(){
  sixteenthNoteTime = 60 / tempo / 4;
  timer = setTimeout(function(){
    playCurrentIndex();
    loop();
  }, sixteenthNoteTime*1000)
}



function playCurrentIndex(){
  playArp();
  for (audio in allSounds){
    var track = allSounds[audio];
    var pattern = track.pattern
    if (pattern[rhythmIndex]) {
      playSound(track)
    }
  }

  var activePads =  $('.'+rhythmIndex+'.active')
  animateElement(activePads)
  movePlayhead(rhythmIndex)
  progressRhythm()
};

function movePlayhead(index){
  $('.bar').css({
    'background-color':'',
  });
  $('#'+ index).css({
    'background-color':'red',
  });
}


function playArp(){
  for(i = 1; i < 14; i++){
    note = arp[i]
    if(note[rhythmIndex]){
      oscillator = context.createOscillator();
      gain = context.createGain();
      gain.gain.value = noteGain;
      oscillator.frequency.value = scale[i];
      oscillator.type = arpShape;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(0)
      oscillator.stop(context.currentTime + (sixteenthNoteTime* gate))
    }
  }
  var note = $('.note.active[data-position="'+rhythmIndex+'"]')
  animateElement(note)

}

function progressRhythm(){
  if(rhythmIndex < 16){
    rhythmIndex++
  }else{
    rhythmIndex = 1
  }
}

function stopSequence(){
  clearTimeout(timer)
  playing = false
  rhythmIndex = 1
  $('.bar').css('background-color','');
  toggleButton()
};



function clearPads(){
  stopSequence();
  for (audio in allSounds){
    allSounds[audio].pattern = {}
  }
  $('div.pad').stop().css('background-color', 'white').removeClass('active lit');
}

function clearNotes(){
  for (note in arp){
    arp[note] = {}
  }
  $('.note').stop().css('background-color', 'white').removeClass('active lit');
}




function playButtonListener(){
  $('button.play').on('click', function(){
    if (playing){
      stopSequence();
    } else {
      play();
    }
  });
}

function toggleButton(){
  var button = $('button.play')
  if (!playing){
    button.addClass('glyphicon-play btn-success')
    button.removeClass('glyphicon-stop btn-danger')
  } else {
    button.addClass('glyphicon-stop btn-danger')
    button.removeClass('glyphicon-play btn-success')
  }
}

function stopButtonListener(){
  $('button.stop').on('click', function(){

  });
};


function trashButtonListener(){
  $('.trash').on('click', function(){
    var prompt = confirm("Clear your current pattern?");
    if (prompt == true) {
      clearPads();
      clearNotes();
    }
  })
}


function padClickListener(){
  $('div.pad').on('click', function(){
    var elem = $(this)
    var sound = elem.attr('id')
    var position = elem.attr("value")
    var state = allSounds[sound].pattern[position]
    clearTimeout($(this).timeout)
    if (state){
      elem.removeClass('active')
    } else {
      elem.addClass('active')
    }
    allSounds[sound].pattern[position] = !state
  });
}

function animateElement(elem){
  elem.addClass('lit')
  elem.timeout =  setTimeout(function(){
    elem.removeClass('lit')
  }, 100)
}


function tempoChangeListener(){
  $('input.bpm').on('change', function(){
    tempo = $(this).val()
  });
}


function gainChangeListener(){
  $('input.gain').on('input', function(e){
    e.preventDefault();
    var newGain = $(this).val()
    var instrument = $(this).parent().attr('id')
    allSounds[instrument].gain.gain.value = newGain
  });
};

function instrumentLabelClickListener(){
  $('.instrument_label').on('click', function(){
    var sound = $(this).html()
    for (audio in allSounds){
      var track = allSounds[audio];
      if (track.name === sound) {
        playSound(track)
      }
    }
  })
}






function buildStepNumbers(){
  for (var i = 1; i < 17; i++) {
    var context = {number: i};
    var html = $('#step_number_template').html();
    var templatingFunction = Handlebars.compile(html);
    $('.step_number_container').prepend(templatingFunction(context));
  };
};

function drawFourStepBars(){
  $('.bar#1').append("<div class='bar_line'></div>")
  $('.bar#5').append("<div class='bar_line'></div>")
  $('.bar#9').append("<div class='bar_line'></div>")
  $('.bar#13').append("<div class='bar_line'></div>")
}



function buildTracks(){
  var context = {sounds: allSounds};
  var html = $('#track_template').html();
  var templatingFunction = Handlebars.compile(html);
  $('#instrument_container').append(templatingFunction(context));
};

function buildPads(){
  for(track in allSounds){
    var instrument = allSounds[track].name
    for (var i = 1; i < 17; i++) {
      var pads = $('div.' + instrument +'_pads')
      pads.append("<div class='" + instrument +" pad " + i + "' id=" + instrument + " value='" + i +"'></div>")
    };
  }
}



function arpPadListener(){
  $('.note').on('click', function(){
    var note = $(this).parent().attr("data-note")
    var position = $(this).attr("data-position")
    if ($(this).hasClass('active')){
      $(this).removeClass('active')
      $(this).css('background-color', 'white');
      arp[note][position] = false
    } else {
      $(this).addClass('active')
      $(this).css('background-color', 'red')
      arp[note][position] = true
    }
  })
}

function arpGateListener(){
  $("input[name=gate]").on('input', function(){
    var newGate = $(this).val()
    console.log(newGate)
    gate = newGate
  })
}

function arpGainListener(){
  $("input.note-gain").on('input', function(){
    var newGain = $(this).val()
    noteGain = newGain
  })
}

function arpShapeListener(){
  $('.arp.controls.btn').on('click', function(){
    $('.arp.controls.btn').removeClass('lit')
    var button = $(this)
    button.addClass('lit')
    var shape = button.attr('data-shape')
    arpShape = shape

      console.log()
  })
}


function setInitialPattern(){
  allSounds.clap.pattern = {5: true, 13: true}
  allSounds.snare.pattern = {5: true, 13: true}
  allSounds.hatClosed.pattern = {3: true, 7: true, 11: true, 15: true}
  allSounds.kickHi.pattern = {1: true, 8: true, 11: true}
  allSounds.clav.pattern = {4: true, 12: true}
  allSounds.tomLo.pattern = {16: true}
  for(sound in allSounds){
    var audio = allSounds[sound]
    for (var i = 1; i <= 16; i++) {
      if (audio.pattern[i]){
        $('div.' + audio.name + '.pad.' + i).addClass('active')
      }
    };
  }

}

function setArpPattern(){
  arp[1] = {1: true, 5: true, 12: true}
  arp[3] = {13: true}
  arp[5] = {2: true, 4: true, 8: true, 10: true}
  arp[6] = {5: true, 7: true}
  arp[8] = {8: true, 10: true, 13: true}
  arp[10] = {2: true, 5: true}
  arp[12] = {13: true, 15: true}
  arp[13] = {2: true, 8: true, 10: true, 16: true}
  for (var i = 1; i <= 13; i++) {
    for (var j = 1; j <= 16; j++) {
      if (arp[i][j]){
        $('div.note-row[data-note="' + i + '"] button[data-position="' + j + '"]').addClass('active')
      }
    };
  };

}

function resizeListener(){
  window.onresize = resizePads
}

function resizePads(){
  var pads = $('.pad')
  var width = $(pads[0]).width()
  $('.instrument_row').height(width)
  $('.controls').height(width)
  $('.instrument_label').height(width/2)
  console.log($('.arppegiator').innerHeight())
  $('.controls-container').height($('.arppegiator').height())
  for (var i = 0; i < pads.length; i++) {
    var pad = $(pads[i])
    pad.height(width)
  };
}


function buildBoard(){
  buildStepNumbers();
  drawFourStepBars();
  buildTracks();
  buildPads();
};

function initializeControls(){
  playButtonListener();
  stopButtonListener();
  trashButtonListener();
  padClickListener();
  instrumentLabelClickListener();
  tempoChangeListener();
  gainChangeListener();
  arpPadListener();
  arpGateListener();
  arpGainListener();
  arpShapeListener()
  resizePads()
  resizeListener()
};


function start(){
  buildBoard();
  loadAllSounds();
  initializeControls();
  setInitialPattern();
  setArpPattern();
}

$(document).ready(function() {
  start()
});




