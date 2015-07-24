
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
  $('.instrument_label.'+audio.name).animate( { backgroundColor: "red" }, 0 )
  .animate( { backgroundColor: "white" }, 100 );

}

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


var tempo = 95;
var rhythmIndex = 1;
var playing = false;
var sixteenthNoteTime;
var timer;


function play(){
  if(!playing){
    loop();
    playing = true;
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
  $('.'+rhythmIndex+'.active')
  .animate( { backgroundColor: "yellow" }, 0 )
  .animate( { backgroundColor: "red" }, 500 );
  movePlayhead(rhythmIndex)
  progressRhythm()
};



function playArp(){
  for(i = 1; i < 9; i++){
    note = arp[i]
    if(note[rhythmIndex]){
      oscillator = context.createOscillator();
      gain = context.createGain();
      gain.gain.value = .1;
      oscillator.frequency.value = scale[i];
      oscillator.type = "sawtooth";
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(0)
      oscillator.stop(context.currentTime + (sixteenthNoteTime* gate))
    }
  }
  $('.note.active[data-position="'+rhythmIndex+'"]')
  .animate( { backgroundColor: "yellow" }, 0 )
  .animate( { backgroundColor: "red" }, 500 );
}

function progressRhythm(){
  if(rhythmIndex < 16){
    rhythmIndex++
  }else{
    rhythmIndex = 1
  }
}

function stop_sequence(){
  clearTimeout(timer)
  playing = false
  rhythmIndex = 1
  $('.bar').css('background-color','');
};




function playButtonListener(){
  $('button.play').on('click', function(){
    play();
  });
}

function stopButtonListener(){
  $('button.stop').on('click', function(){
    stop_sequence();
  });
};


function trashButtonListener(){
  $('.trash').on('click', function(){
    var prompt = confirm("Clear your current pattern?");
    if (prompt == true) {
      clearPads();
    }
  })
}

function clearPads(){
  for (audio in allSounds){
    allSounds[audio].pattern = {}
  }
  $('div.pad').stop().css('background-color', 'white').removeClass('active');
  stop_sequence();
}

function padClickListener(){
  $('div.pad').on('click', function(){
    var sound = $(this).attr('id')
    var position = $(this).attr("value")

    if ($(this).hasClass('active')){
      $(this).removeClass('active')
      $(this).css('background-color', 'white')
      allSounds[sound].pattern[position] = false
    } else {
      $(this).addClass('active')
      $(this).css('background-color', 'red')
      allSounds[sound].pattern[position] = true
    }
  });
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


function movePlayhead(index){
  $('.bar').css({
    'background-color':'',
  });
  $('#'+ index).css({
    'background-color':'red',
  });
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


var arp = {
 1: {},
 2: {},
 3: {},
 4: {},
 5: {},
 6: {},
 7: {},
 8: {},
}


var scale = {
  1: 261.63,
  2: 293.66,
  3: 329.63,
  4: 349.23,
  5: 392.00,
  6: 440.00,
  7: 493.88,
  8: 523.25,
}

var gate = 1


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
  $("input.gate").on('input', function(){
    var newGate = $(this).val()
    gate = newGate
  })
}


function setInitialPattern(){
  allSounds.clap.pattern = {5: true, 13: true}
  $('div.clap.pad.5').addClass('active')
  $('div.clap.pad.13').addClass('active')
  allSounds.snare.pattern = {5: true, 13: true}
  $('div.snare.pad.5').addClass('active')
  $('div.snare.pad.13').addClass('active')
  allSounds.hatClosed.pattern = {3: true, 7: true, 11: true, 15: true}
  $('div.hatClosed.pad.3').addClass('active')
  $('div.hatClosed.pad.7').addClass('active')
  $('div.hatClosed.pad.11').addClass('active')
  $('div.hatClosed.pad.15').addClass('active')
  allSounds.kickHi.pattern = {1: true, 8: true, 11: true}
  $('div.kickHi.pad.1').addClass('active')
  $('div.kickHi.pad.8').addClass('active')
  $('div.kickHi.pad.11').addClass('active')
  allSounds.clav.pattern = {4: true, 12: true}
  $('div.clav.pad.4').addClass('active')
  $('div.clav.pad.12').addClass('active')
  allSounds.tomLo.pattern = {16: true}
  $('div.tomLo.pad.16').addClass('active')
}

function setArpPattern(){
  arp[1] = {1: true, 5: true, 12: true}
  arp[2] = {13: true}
  arp[3] = {2: true, 4: true, 8: true, 10: true}
  arp[4] = {5: true, 7: true}
  arp[5] = {8: true, 10: true, 13: true}
  arp[6] = {2: true, 5: true}
  arp[7] = {13: true, 15: true}
  arp[8] = {2: true, 8: true, 10: true, 16: true}

  for (var i = 1; i <= 8; i++) {
    for (var j = 1; j <= 16; j++) {
      if (arp[i][j]){
        $('div.note-row[data-note="' + i + '"] button[data-position="' + j + '"]').addClass('active')
      }
    };
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
  arpPadListener()
  arpGateListener()
};

$(document).ready(function() {
  buildBoard();
  loadAllSounds();
  initializeControls();
  setInitialPattern();
  setArpPattern();
});




