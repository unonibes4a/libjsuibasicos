 
       
       
       
       

class GioAudioTeclaDic302025 {
  constructor(htmlParent, idGenerico) {
    this.css();
    this.htmlParent = htmlParent;
    this.idGenerico = idGenerico;
    this.booladdEventListener=false;
    
 
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    
 
    this.masterGain = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.distortion = this.ctx.createWaveShaper();
    this.distGain = this.ctx.createGain();
    this.delayNode = this.ctx.createDelay();
    this.delayFeedback = this.ctx.createGain();
    this.delayWet = this.ctx.createGain();
    this.reverbNode = this.ctx.createConvolver();
    this.reverbWet = this.ctx.createGain();
    this.trackInput = this.ctx.createGain();
    
    
    this.filterBypass = this.ctx.createGain();
    this.distortionBypass = this.ctx.createGain();
    
     
    this.masterGain.gain.value = 0.5;
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 14;
    this.distGain.gain.value = 1;
    this.distortion.curve = this.makeDistortionCurve(0);
    this.delayNode.delayTime.value = 0.3;
    this.delayFeedback.gain.value = 0.4;
    this.delayWet.gain.value = 0.04;
    this.reverbWet.gain.value = 1.0;
    this.reverbNode.buffer = this.impulseResponse(2, 2);
    
 
    this.filterEnabled = true;
    this.distortionEnabled = true;
    this.delayEnabled = true;
    this.reverbEnabled = true;
    
   
    this.setupAudioChain();
    
 
    this.audioBuffer = null;
    
   
    this.activeVoices = new Map();  
    this.keysPressed = new Set();  
    
    this.tuneValue = 0;
    this.tracks = [];
    this.trackIdCounter = 0;
    
 
    this.sliders = {};
    
    
    this.init();
  }
  
  setupAudioChain() {
  
    this.trackInput.connect(this.distortion);
    this.distortion.connect(this.distGain);
    this.distGain.connect(this.filter);
    
   
    this.filter.connect(this.masterGain);
    this.filter.connect(this.delayNode);
    this.filter.connect(this.reverbNode);
    
     
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.masterGain);
    
   
    this.reverbNode.connect(this.reverbWet);
    this.reverbWet.connect(this.masterGain);
    
    this.masterGain.connect(this.ctx.destination);
  }
  
  init() {
    this.createHTML();
    this.createSliders();
    this.attachEventListeners();
  }
  texto=(s)=>{
   JsTools.createMessage(s);
  }
   css = () => {
    JsTools.cssScroll();
                if (!document.getElementById("tracksimpl302025div30dic")) {
                    const styleTag = document.createElement('style');
                    styleTag.id = "tracksimpl302025div30dic";
                    styleTag.textContent = `
                      .audio-synth-container {
                    position:relative;
                    left:0px;
                    top:0px;        
                    height:100%;
                    width:100%;
                    font-family: Arial, sans-serif;
                    max-width: 300px;
                     max-height: 300px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #1a1a1a85;
                    color: white;
                    display: flex;
                    justify-content: flex-start;
                    gap: 10px;
                    flex-wrap: wrap;
                    padding-top: 0;
                    padding-bottom: 0;
                    overflow:hidden;
        }

          
        .sectionz {
                position:relative;
                left:0px;
                top:0px;        
                height:80%;
                width:100%;
                background: #2a2a2a;
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
                display: flex;
                justify-content: flex-start;
                gap: 10px;
                flex-wrap: wrap;
                padding-top: 0;
                padding-bottom: 0;
 

        }

        .labelinput30d2025 { 
        position:relative;
                left:0px;
                top:0px;        
                  width:47px;
            height:47px;
            background-color: #353535;
            color: #c7c7c7;
            cursor: pointer;

            font-size: 10px;
            border-radius: 50%;
            transition: all 0.2s ease-in-out;  
            display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	align-content: center; 
        }

      .labelinput30d2025:hover {
         background-color: #313131;
            color: #ffffff;
        }
                      
                    `;
                    document.head.appendChild(styleTag);
                }
            }
        
  
  createHTML() {
    this.htmlParent.innerHTML = `
      <div class="audio-synth-container">        
        <div class="sectionz"  >
             <label  for="${this.idGenerico}-audio-file"  id="app" class="labelinput30d2025"  >open </label>

         <input type="file" id="${this.idGenerico}-audio-file" accept="audio/*" style="display: none;">
        </div>
        
        <div class="sectionz" style=" display: none;">
          <h3>Teclado</h3>
          <div id="${this.idGenerico}-piano-keys-container"></div>
          <div class="sectionz">
          <h3>Multi-Track</h3>
          <button id="${this.idGenerico}-add-track-btn" class="add-track-btn">+ Agregar Pista</button>
          <div id="${this.idGenerico}-tracks-container" class="tracks-container"></div>
        </div>
        </div>
        
        
        
         
      </div>
      
    `;
    
   
    let keysContainer = document.getElementById(`${this.idGenerico}-piano-keys-container`);
    this.box = new BoxDiv(keysContainer);
    this.boxslider = new BoxDiv(keysContainer);
    
     
    const keys = ['A'];/* ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K']; */
    const notes = [0 ];/* [0, 2, 4, 5, 7, 9, 11, 12]; // C D E F G A B C (octava) */
    
    keys.forEach((key, index) => {
      let bt = new BtCircle(this.box.contentWrapper, `${this.idGenerico}-key-${key}`, key, null);
      this.pressKey(bt.label, notes[index], key);
      
 
      bt.label.dataset.keyId = key;
    });
  }
  
  createSliders() {
    this.sliders.volume = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-volume`,
      0, 2, 0.5, 0.01,
      "Volumen Master",
      (val) => {
        this.masterGain.gain.value = parseFloat(val);
      },
      null,
      true
    );
    
    this.sliders.tune = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-tune`,
      -24, 24, 0, 1,
      "Afinación (semitonos)",
      (val) => {
        this.tuneValue = parseInt(val);
      },
      null,
      true
    );
    
    this.sliders.filterFreq = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-filter-freq`,
      20, 20000, 2000, 1,
      "Frecuencia",
      (val) => {
        this.filter.frequency.value = parseFloat(val);
      },
      (isChecked) => {
        this.filterEnabled = isChecked;
        this.updateFilterBypass();
      },
      true
    );
    
    this.sliders.filterQ = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-filter-q`,
      0, 30, 14, 0.1,
      "Resonancia",
      (val) => {
        this.filter.Q.value = parseFloat(val);
      },
      null,
      true
    );
    
    this.sliders.distAmount = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-dist-amount`,
      0, 100, 0, 1,
      "dist-amount",
      (val) => {
        this.distortion.curve = this.makeDistortionCurve(parseInt(val));
      },
      (isChecked) => {
        this.distortionEnabled = isChecked;
        this.updateDistortionBypass();
      },
      true
    );
    
    this.sliders.distGain = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-dist-gain`,
      0, 5, 1, 0.01,
      "Dist-gain",
      (val) => {
        this.distGain.gain.value = parseFloat(val);
      },
      null,
      true
    );
    
    this.sliders.delayTime = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-delay-time`,
      0, 2, 0.3, 0.01,
      "DelayTiempo",
      (val) => {
        this.delayNode.delayTime.value = parseFloat(val);
      },
      (isChecked) => {
        this.delayEnabled = isChecked;
        this.delayWet.gain.value = isChecked ? this.sliders.delayMix.getValue() : 0;
      },
      true
    );
    
    this.sliders.delayFeedback = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-delay-fb`,
      0, 0.95, 0.4, 0.01,
      "DelayFeedback",
      (val) => {
        this.delayFeedback.gain.value = parseFloat(val);
      },
      null,
      true
    );
    
    this.sliders.delayMix = new Slider18Nov2025( 
      this.boxslider.contentWrapper,
      `${this.idGenerico}-delay-mix`,
      0, 1, 0.04, 0.01,
      "Delay-mix",
      (val) => {
        if (this.delayEnabled) {
          this.delayWet.gain.value = parseFloat(val);
        }
      },
      null,
      true
    );
    
    this.sliders.reverbDecay = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-reverb-decay`,
      0.1, 100, 20, 0.1,
      "Reverb-decay",
      (val) => {
        const v = parseFloat(val);
        this.reverbNode.buffer = this.impulseResponse(v, v);
      },
      (isChecked) => {
        this.reverbEnabled = isChecked;
        this.reverbWet.gain.value = isChecked ? this.sliders.reverbMix.getValue() : 0;
      },
      true
    );
    
    this.sliders.reverbMix = new Slider18Nov2025(
      this.boxslider.contentWrapper,
      `${this.idGenerico}-reverb-mix`,
      0, 2, 1, 0.01,
      "Reverb-mix",
      (val) => {
        if (this.reverbEnabled) {
          this.reverbWet.gain.value = parseFloat(val);
        }
      },
      null,
      true
    );
  }
  
  updateFilterBypass() {
    if (!this.filterEnabled) {
      this.filter.frequency.value = 20000;  
    } else {
      this.filter.frequency.value = this.sliders.filterFreq.getValue();
    }
  }
  
  updateDistortionBypass() {
    if (!this.distortionEnabled) {
      this.distortion.curve = this.makeDistortionCurve(0);
    } else {
      this.distortion.curve = this.makeDistortionCurve(this.sliders.distAmount.getValue());
    }
  }
  
  pressKey(keyElement, semitoneOffset = 0, keyId = '') {
    keyElement.addEventListener('mousedown', () => this.playNote(semitoneOffset, keyId));
    keyElement.addEventListener('mouseup', () => this.stopNote(keyId));
    keyElement.addEventListener('touchstart', (e) => { 
      e.preventDefault(); 
      this.playNote(semitoneOffset, keyId); 
    });
    keyElement.addEventListener('touchend', (e) => { 
      e.preventDefault(); 
      this.stopNote(keyId); 
    });
  }
  
  attachEventListeners() { 
    document.getElementById(`${this.idGenerico}-audio-file`).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const arrayBuffer = await file.arrayBuffer();
        this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.texto(file.name);
       
      } catch (error) {
       
      }
    }); 
 
    document.addEventListener('keydown', (e) => {
        if(this.booladdEventListener){
           if (e.repeat) return;        
      const key = e.key.toLowerCase();
      const keyMap = { 
        'a': 0, 's': 2, 'd': 4, 'f': 5,
        'g': 7, 'h': 9, 'j': 11, 'k': 12
      };      
      if (keyMap.hasOwnProperty(key)) { 
        if (!this.keysPressed.has(key)) {
          this.keysPressed.add(key);
          this.playNote(keyMap[key], key);      
          const btn = document.querySelector(`[data-key-id="${key.toUpperCase()}"]`);
          if (btn) btn.classList.add('active');
        }
      }  
        }
      
    });
    
    document.addEventListener('keyup', (e) => {
        if(this.booladdEventListener){ const key = e.key.toLowerCase();
      const keyMap = { 
        'a': 0, 's': 2, 'd': 4, 'f': 5,
        'g': 7, 'h': 9, 'j': 11, 'k': 12
      };      
      if (keyMap.hasOwnProperty(key)) {
        this.keysPressed.delete(key);
        this.stopNote(key);       

        const btn = document.querySelector(`[data-key-id="${key.toUpperCase()}"]`);
        if (btn) btn.classList.remove('active');
      }}
      
    });    
 
    document.getElementById(`${this.idGenerico}-add-track-btn`).addEventListener('click', () => {
      this.addTrack();
    });
  }
  
  makeDistortionCurve(amount) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
  
  impulseResponse(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const val = Math.pow(1 - i / length, decay);
      left[i] = (Math.random() * 2 - 1) * val;
      right[i] = (Math.random() * 2 - 1) * val;
    }
    return impulse;
  }
  
  // **NUEVO: playNote con sistema de voces múltiples**
  playNote(semitoneOffset = 0, keyId = '') {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // Si esta nota ya está sonando, no hacer nada
    if (this.activeVoices.has(keyId)) return;
    
    const voice = {
      env: this.ctx.createGain(),
      source: null,
      trackVoices: []
    };
    
    voice.env.connect(this.trackInput);
    
    const now = this.ctx.currentTime;
    voice.env.gain.setValueAtTime(0, now);
    voice.env.gain.linearRampToValueAtTime(0.3, now + 0.01); // Reducido a 0.3 para evitar saturación
    
    const totalSemitones = this.tuneValue + semitoneOffset;
    
    if (this.audioBuffer) {
      voice.source = this.ctx.createBufferSource();
      voice.source.buffer = this.audioBuffer;
      voice.source.loop = true;
      voice.source.playbackRate.value = Math.pow(2, totalSemitones / 12);
    } else {
      voice.source = this.ctx.createOscillator();
      voice.source.type = 'sawtooth';
      voice.source.frequency.value = 261.63 * Math.pow(2, totalSemitones / 12);
    }
    
    voice.source.connect(voice.env);
    voice.source.start(0);
    
    // Tocar en todas las pistas
    this.tracks.forEach(track => {
      const trackEnv = this.ctx.createGain();
      trackEnv.connect(track.gainNode);
      trackEnv.gain.setValueAtTime(0, now);
      trackEnv.gain.linearRampToValueAtTime(0.3, now + 0.01);
      
      let trackSrc;
      if (this.audioBuffer) {
        trackSrc = this.ctx.createBufferSource();
        trackSrc.buffer = this.audioBuffer;
        trackSrc.loop = true;
        trackSrc.playbackRate.value = Math.pow(2, totalSemitones / 12) * track.pitch;
      } else {
        trackSrc = this.ctx.createOscillator();
        trackSrc.type = 'sawtooth';
        trackSrc.frequency.value = 261.63 * Math.pow(2, totalSemitones / 12) * track.pitch;
      }
      
      trackSrc.connect(trackEnv);
      trackSrc.start(0);
      
      voice.trackVoices.push({
        source: trackSrc,
        env: trackEnv
      });
    });
    
    // Guardar la voz activa
    this.activeVoices.set(keyId, voice);
  }
  
  // **NUEVO: stopNote para voz específica**
  stopNote(keyId = '') {
    const voice = this.activeVoices.get(keyId);
    if (!voice) return;
    
    const now = this.ctx.currentTime;
    
    // Fade out del envelope principal
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    voice.source.stop(now + 0.1);
    
    // Fade out de las voces de las pistas
    voice.trackVoices.forEach(trackVoice => {
      trackVoice.env.gain.cancelScheduledValues(now);
      trackVoice.env.gain.setValueAtTime(trackVoice.env.gain.value, now);
      trackVoice.env.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      trackVoice.source.stop(now + 0.1);
    });
    
    // Limpiar después del fade out
    setTimeout(() => {
      try {
        voice.source.disconnect();
        voice.env.disconnect();
        voice.trackVoices.forEach(tv => {
          tv.source.disconnect();
          tv.env.disconnect();
        });
      } catch(e){}
      
      this.activeVoices.delete(keyId);
    }, 150);
  }
  
  addTrack() {
    const trackId = this.trackIdCounter++;
    const track = {
      id: trackId,
      volume: 1,
      pitch: 1,
      gainNode: this.ctx.createGain(),
      sliders: {}
    };
    
    track.gainNode.gain.value = 1;
    track.gainNode.connect(this.trackInput);
    
    this.tracks.push(track);
    
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-item';
    trackDiv.id = `${this.idGenerico}-track-${trackId}`;
    trackDiv.innerHTML = `
      <div class="track-header">
        <h4>Pista ${trackId + 1}</h4>
        <button class="remove-track-btn" data-track-id="${trackId}">✕ Eliminar</button>
      </div>
      <div id="${this.idGenerico}-track-vol-${trackId}"></div>
      <div id="${this.idGenerico}-track-pitch-${trackId}"></div>
    `;
    
    document.getElementById(`${this.idGenerico}-tracks-container`).appendChild(trackDiv);
    
    // Crear sliders para la pista
    track.sliders.volume = new Slider18Nov2025(
      document.getElementById(`${this.idGenerico}-track-vol-${trackId}`),
      `${this.idGenerico}-trackvol-${trackId}`,
      0, 2, 1, 0.01,
      "Volumen",
      (val) => {
        track.volume = parseFloat(val);
        track.gainNode.gain.value = track.volume;
      },
      null,
      true
    );
    
    track.sliders.pitch = new Slider18Nov2025(
      document.getElementById(`${this.idGenerico}-track-pitch-${trackId}`),
      `${this.idGenerico}-trackpitch-${trackId}`,
      0.01, 7, 1, 0.01,
      "Pitch",
      (val) => {
        track.pitch = parseFloat(val);
      },
      null,
      true
    );
    
    
    trackDiv.querySelector('.remove-track-btn').addEventListener('click', () => {
      this.removeTrack(trackId);
    });
  }
  
  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const track = this.tracks[index];
    track.gainNode.disconnect();
    this.tracks.splice(index, 1);
    
    document.getElementById(`${this.idGenerico}-track-${trackId}`).remove();
  }
}
       
       
       
       class JsTools {
            static cssScroll = () => {
                if (!document.getElementById("scrool302025dic")) {
                    const styleTag = document.createElement('style');
                    styleTag.id = "scrool302025dic";
                    styleTag.textContent = ` ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: #333333; border-radius: 4px; }
                ::-webkit-scrollbar-thumb { background: #454545; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #242424ff; }
                * { scrollbar-width: thin; scrollbar-color: #454545 #333333; }
               html{position:relative; left:0%; top:0%; width: 100%;  height:  100%;}
               body{position:relative; left:0%; top:0%; width: 100%;  height:  100%;} 

			   .todobox {
                    max-height: 0;
                    overflow: visible;
                    transition: max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                                visibility 0s 0.4s, 
                                opacity 0.4s ease;
                    padding: 0 15px;
                    display: flex;
                    justify-content: flex-start;
                    gap: 10px;
                    flex-wrap: wrap;
                    padding-top: 0;
                    padding-bottom: 0;
                    position: relative;
                    visibility: hidden;
                    opacity: 0;
                }
               
        .message {
            background-color: #373737;
            color: #ffffff;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-width: 300px;
            opacity: 0;
            transform: translateY(100%);
            animation: slideIn 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }

        @keyframes slideIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-100%);
            }
        }

        .message.hide {
            animation: slideOut 0.8s forwards ease-out;
        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            static createDiv(id = '', classNames = [], innerHTML = '', parent = null) {
                const div = document.createElement('div');
                if (id) div.id = id;
                if (classNames.length) div.classList.add(...classNames);
                if (innerHTML) div.innerHTML = innerHTML;
                if (parent instanceof HTMLElement) parent.appendChild(div);
                return div;
            }

            static createElement(tagName, id = '', classNames = [], innerHTML = '', parent = null, attributes = {}) {
                const element = document.createElement(tagName);
                if (id) element.id = id;
                if (classNames.length) element.classList.add(...classNames);
                if (innerHTML) element.innerHTML = innerHTML;
                for (const attr in attributes) {
                    if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
                        element.setAttribute(attr, attributes[attr]);
                    }
                }
                if (parent instanceof HTMLElement) parent.appendChild(element);
                return element;
            }

            static changeParentElement(childElement, newParent, referenceNode = null) {
                if (!(childElement instanceof HTMLElement)) {
                    return;
                }
                if (newParent && !(newParent instanceof HTMLElement)) {
                    return;
                }
                if (referenceNode && !(referenceNode instanceof HTMLElement)) {
                    return;
                }

                if (newParent) {
                    if (referenceNode) {
                        newParent.insertBefore(childElement, referenceNode);
                    } else {
                        newParent.appendChild(childElement);
                    }
                } else {
                    if (childElement.parentNode) {
                        childElement.parentNode.removeChild(childElement);
                    }
                }
            }

            static deleteElement(element) {
                if (element instanceof HTMLElement && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }

            static emptyElement(element) {
                if (element instanceof HTMLElement) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                }
            }

            static cloneElement(element, deep = true, newParent = null) {
                if (element instanceof HTMLElement) {
                    const clone = element.cloneNode(deep);
                    if (newParent instanceof HTMLElement) {
                        newParent.appendChild(clone);
                    }
                    return clone;
                }
                return null;
            }

            static addClass(element, ...classNames) {
                if (element instanceof HTMLElement) {
                    element.classList.add(...classNames);
                }
            }

            static removeClass(element, ...classNames) {
                if (element instanceof HTMLElement) {
                    element.classList.remove(...classNames);
                }
            }

            static toggleClass(element, className, force) {
                if (element instanceof HTMLElement) {
                    element.classList.toggle(className, force);
                }
            }

            static hasClass(element, className) {
                if (element instanceof HTMLElement) {
                    return element.classList.contains(className);
                }
                return false;
            }

            static setAttribute(element, attributeName, value) {
                if (element instanceof HTMLElement) {
                    element.setAttribute(attributeName, value);
                }
            }

            static getAttribute(element, attributeName) {
                if (element instanceof HTMLElement) {
                    return element.getAttribute(attributeName);
                }
                return null;
            }

            static removeAttribute(element, attributeName) {
                if (element instanceof HTMLElement) {
                    element.removeAttribute(attributeName);
                }
            }

            static setStyle(element, property, value) {
                if (element instanceof HTMLElement) {
                    element.style[property] = value;
                }
            }

            static getStyle(element, property) {
                if (element instanceof HTMLElement) {
                    return getComputedStyle(element)[property];
                }
                return null;
            }

            static on(element, eventType, handler, options = {}) {
                if (element instanceof HTMLElement) {
                    element.addEventListener(eventType, handler, options);
                }
            }

            static off(element, eventType, handler, options = {}) {
                if (element instanceof HTMLElement) {
                    element.removeEventListener(eventType, handler, options);
                }
            }

            static getById(id) {
                return document.getElementById(id);
            }

            static query(selector, parent = document) {
                return parent.querySelector(selector);
            }

            static queryAll(selector, parent = document) {
                return Array.from(parent.querySelectorAll(selector));
            }

            static debounce(func, delay) {
                let timeout;
                return function(...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), delay);
                };
            }

            static throttle(func, limit) {
                let inThrottle;
                let lastResult;
                return function(...args) {
                    const context = this;
                    if (!inThrottle) {
                        inThrottle = true;
                        lastResult = func.apply(context, args);
                        setTimeout(() => inThrottle = false, limit);
                    }
                    return lastResult;
                };
            }

            static scrollToElement(element, options = { behavior: 'smooth' }) {
                if (element instanceof HTMLElement) {
                    element.scrollIntoView(options);
                }
            }

            static createMessage(text,backgroundColor = '#373737d7', duration = 5000, containerId = 'message-container', maxMessages = 20) {
                 
                let container = JsTools.getById(containerId);
                if (!container) {
                    container = JsTools.createDiv(containerId, [], '', document.body);
                    JsTools.setStyle(container, 'position', 'fixed');
                    JsTools.setStyle(container, 'bottom', '20px');
                    JsTools.setStyle(container, 'right', '20px');
                    JsTools.setStyle(container, 'display', 'flex');
                    JsTools.setStyle(container, 'flexDirection', 'column-reverse');
                    JsTools.setStyle(container, 'gap', '10px');
                    JsTools.setStyle(container, 'zIndex', '1000');
                }

                const messageElement = JsTools.createDiv('', ['message'], text, container);
                JsTools.setStyle(messageElement, 'backgroundColor', backgroundColor);
                
                let messageInfo = {
                    element: messageElement,
                    timeoutId: null
                };

                if (!container.activeMessages) {
                    container.activeMessages = [];
                }
                container.activeMessages.push(messageInfo);

                messageInfo.timeoutId = setTimeout(() => {
                    JsTools.hideMessage(messageElement, container.activeMessages);
                }, duration);

                if (container.activeMessages.length > maxMessages) {
                    const oldestMessageInfo = container.activeMessages.shift();
                    clearTimeout(oldestMessageInfo.timeoutId);
                    JsTools.hideMessage(oldestMessageInfo.element, container.activeMessages, 0);
                }
            }

            static hideMessage(messageElement, activeMessagesList, delay = 0) {
                if (!messageElement) return;

                setTimeout(() => {
                    JsTools.addClass(messageElement, 'hide');

                    messageElement.addEventListener('animationend', function handler() {
                        JsTools.deleteElement(messageElement);
                        const index = activeMessagesList.findIndex(info => info.element === messageElement);
                        if (index !== -1) {
                            activeMessagesList.splice(index, 1);
                        }
                        messageElement.removeEventListener('animationend', handler);
                    }, { once: true });
                }, delay);
            }
        }

 



class BoxDiv {
    constructor(parentHtml = document.body, title = "Contenedor Desplegable") {
        this.css();
        this.parentHtml = parentHtml;
        this.title = title;
        this.isOpen = false;

        this.render();
    }

    render() {
        this.container = document.createElement('div');
        this.container.classList.add('control-section30idc2025');
        this.parentHtml.appendChild(this.container);

        this.header = document.createElement('div');
        this.header.classList.add('box-div-header');
        this.container.appendChild(this.header);

        this.titleElement = document.createElement('span');
        this.titleElement.classList.add('box-div-title');
        this.titleElement.textContent = this.title;
        this.header.appendChild(this.titleElement);

        this.toggleButton = document.createElement('button');
        this.toggleButton.classList.add('box-div-toggle-button');
        this.toggleButton.innerHTML = '&#9660;';
        this.toggleButton.addEventListener('click', () => this.toggleContent());
        this.header.appendChild(this.toggleButton);

        this.contentWrapper = document.createElement('div');
        this.contentWrapper.classList.add('box-div-content-wrapper');
        this.container.appendChild(this.contentWrapper);

        this.contentWrapper.innerHTML = `
             
        `;

        this.updateToggleState();
    }

    toggleContent() {
        this.isOpen = !this.isOpen;
        this.updateToggleState();
    }

    updateToggleState() {
        if (this.isOpen) {
            this.contentWrapper.style.maxHeight = "500px";
            this.contentWrapper.style.visibility = "visible";
            this.contentWrapper.style.opacity = "1";
            this.toggleButton.innerHTML = '&#9650;';
            this.container.classList.add('is-open');
        } else {
            this.contentWrapper.style.maxHeight = "0";
            this.contentWrapper.style.visibility = "hidden";
            this.contentWrapper.style.opacity = "0";
            this.toggleButton.innerHTML = '&#9660;';
            this.container.classList.remove('is-open');
        }
    }

    appendChild = (elemnt, bool) => { 
        if (bool) {
           elemnt.classList.add('flex-itemdic202530'); 
        }          
        this.contentWrapper.appendChild(elemnt);
    }

    css = () => {
        if (!document.getElementById("boxdivtogglecss30dic")) {
            const styleTag = document.createElement('style');
            styleTag.id = "boxdivtogglecss30dic";
            styleTag.textContent = `
                .control-section30idc2025 {
                    background-color: #333;
                    border: 1px solid #555;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    overflow: visible;
                    transition: all 0.3s ease-out;
                }

                .box-div-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background-color: #444;
                    cursor: pointer;
                    border-bottom: 1px solid #555;
                }

                .control-section30idc2025.is-open .box-div-header {
                     border-bottom: none;
                }

                .box-div-title {
                    color: #fff;
                    font-size: 1.1em;
                    font-weight: bold;
                }

                .box-div-toggle-button {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.2em;
                    cursor: pointer;
                    padding: 5px;
                    transition: transform 0.3s ease;
                }

                .control-section30idc2025.is-open .box-div-toggle-button {
                    transform: rotate(180deg);
                }

                .box-div-content-wrapper {
                    max-height: 0;
                    overflow: visible;
                    transition: max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                                visibility 0s 0.4s, 
                                opacity 0.4s ease;
                    padding: 0 15px;
                    display: flex;
                    justify-content: flex-start;
                    gap: 10px;
                    flex-wrap: wrap;
                    padding-top: 0;
                    padding-bottom: 0;
                    position: relative;
                    visibility: hidden;
                    opacity: 0;
                }

                .control-section30idc2025.is-open .box-div-content-wrapper {
                    padding-top: 15px;
                    padding-bottom: 15px;
                    visibility: visible;
                    opacity: 1;
                    transition: max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                                visibility 0s, 
                                opacity 0.4s ease;
                }

                .flex-itemdic202530 {
                    background-color: #5cb85c;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    flex-shrink: 0;
                    margin-bottom: 5px;
                }
            `;
            document.head.appendChild(styleTag);
        }
    }
}

 
        class BoxDiv250px{
             constructor(parentHtml=document.body  ){
                 this.css();
                 this.container = document.createElement('div');
                 this.container .classList.add('control2-section30idc2025');                
                 this.container .innerHTML = ` `;
                parentHtml.appendChild( this.container );
            }
             css = () => {
                if (!document.getElementById("boxdivcriclecss30dic")) {
                    const styleTag = document.createElement('style');
                    styleTag.id = "boxdivcriclecss30dic";
                    styleTag.textContent = `   .control2-section30idc2025 {
            background-color: #333;
            border: 1px solid #555;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        width
        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }
            
        }

        class BtCircle{
            constructor(parentHtml,idGenerico,texto,eventClic=()=>{}){
                this.css();
this.label= document.createElement('label');
                this.label.classList.add('bt30dic2025circle');
                this.label.id = `${this.idGenerico}btcircle`;
                this.label.innerHTML = `${texto}`;
                parentHtml.appendChild(this.label);
               this.label.onclick=(e)=>{
                    if(eventClic){eventClic(this.label,e);}

                }


            }
             css = () => {
                if (!document.getElementById("btcriclecss30dic")) {
                    const styleTag = document.createElement('style');
                    styleTag.id = "btcriclecss30dic";
                    styleTag.textContent = `
                          .bt30dic2025circle{
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: #ffffff;
            background-color: #232323;
            display: flex;
            align-items: center;
            align-content: center;
            justify-content: center;
            justify-items: center;
            font-size: 10px;
               cursor: pointer;

        }     .bt30dic2025circle:hover{
            background-color: #282828;
            border:3px solid #383838;

        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }
        }
 
        class Slider18Nov2025 {
            constructor(htmlParent, idGenerico, min = 0, max = 100, initialValue = 50, step = 1, textLabel = "val", inputEventCallback = () => {}, checboxInputEvento = () => {}, initialCheckboxState = true) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.defaultMinValue = min;
                this.defaultMaxValue = max;
                this.defaultInitialValue = initialValue;
                this.defaultStep = step;
                this.inputEventCallback = inputEventCallback;
                this.textLabel = textLabel;
                this.elemCheckbox = null;
                this.checboxInputEvento = checboxInputEvento;
                this.elements = {};
                this.initialCheckboxState = initialCheckboxState; 

                this.css();
                this.createSliderElements();
                this.attachEventListeners();
                this.updateSliderValueDisplay();

                this.elements.slider.disabled = !this.initialCheckboxState;
                this.elements.minInput.disabled = !this.initialCheckboxState;
                this.elements.maxInput.disabled = !this.initialCheckboxState;
                this.elements.stepInput.disabled = !this.initialCheckboxState;
            }

            css = () => {
                if (!document.getElementById("idcss30dicSldier")) {
                    const styleTag = document.createElement('style');
                    styleTag.id = "idcss30dicSldier";
                    styleTag.textContent = `
                        .checboxsldier30div2025{
                            position: absolute;
                            right:70px;
                        }
                        .gio18112025tag-slider-container {
                            margin-bottom: 15px;
                            position: relative; 
                        }

                        .gio18112025tag-top-row {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 8px;
                        }

                        .gio18112025tag-label-value {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }

                        .gio18112025tag-toggle-button {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 4px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.75rem;
                            transition: all 0.2s;
                        }

                        .gio18112025tag-toggle-button:hover {
                            background: #515151;
                        }

                        .gio18112025tag-slider-input {
                            width: 100%;
                            height: 6px;
                            background: #555;
                            border-radius: 3px;
                            outline: none;
                            cursor: pointer;
                        }

                        .gio18112025tag-slider-input::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 16px;
                            height: 16px;
                            background: #ffffff;
                            cursor: pointer;
                            border-radius: 50%;
                        }

                        .gio18112025tag-slider-input::-moz-range-thumb {
                            width: 16px;
                            height: 16px;
                            background: #ffffff;
                            cursor: pointer;
                            border-radius: 50%;
                            border: none;
                        }

                        .gio18112025tag-controls-hidden {
                            max-height: 0;
                            overflow: hidden;
                            transition: max-height 0.3s ease;
                        }

                        .gio18112025tag-controls-visible {
                            max-height: 200px;
                            margin-top: 10px;
                        }

                        .gio18112025tag-min-max-wrapper,
                        .gio18112025tagcontenedi {
                            display: flex;
                            gap: 8px;
                            align-items: center;
                            margin-bottom: 8px;
                        }

                        .gio18112025tag-label {
                            color: #aaa;
                            font-size: 0.85rem;
                        }

                        .gio18112025tag-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 4px 8px;
                            border-radius: 4px;
                            width: 70px;
                        }

                        .gio18112025tag-reset-button {
                            background: #515151;
                            border: 1px solid #666;
                            color: #ffffff;
                            padding: 4px 12px;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s;
                        }

                        .gio18112025tag-reset-button:hover {
                            background: #616161;
                        }

                        /* Estilo para slider deshabilitado */
                        .gio18112025tag-slider-input:disabled {
                            background: #333;
                            cursor: not-allowed;
                        }
                        .gio18112025tag-slider-input:disabled::-webkit-slider-thumb {
                            background: #888;
                            cursor: not-allowed;
                        }
                        .gio18112025tag-slider-input:disabled::-moz-range-thumb {
                            background: #888;
                            cursor: not-allowed;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createSliderElements() {
                const container = document.createElement('div');
                container.classList.add('gio18112025tag-slider-container');
                container.id = `${this.idGenerico}-slider-container`;
                container.innerHTML = `
                    <div class="gio18112025tag-top-row">
                        <label for="${this.idGenerico}-slider" class="gio18112025tag-label-value">${this.textLabel}: <span id="${this.idGenerico}-label-value">${this.defaultInitialValue}</span></label>
                        <input type="checkbox" class="checboxsldier30div2025" id="checkbox${this.idGenerico}" ${this.initialCheckboxState ? 'checked' : ''}>
                        <button id="${this.idGenerico}-toggle-button" class="gio18112025tag-toggle-button">Toggle</button>
                    </div>
                    <input type="range" id="${this.idGenerico}-slider" class="gio18112025tag-slider-input" min="${this.defaultMinValue}" max="${this.defaultMaxValue}" value="${this.defaultInitialValue}" step="${this.defaultStep}">
                    <div class="gio18112025tag-controls-hidden" id="${this.idGenerico}-extra-controls">
                        <div class="gio18112025tag-min-max-wrapper">
                            <label for="${this.idGenerico}-min-input" class="gio18112025tag-label">Min:</label>
                            <input type="number" id="${this.idGenerico}-min-input" class="gio18112025tag-input" value="${this.defaultMinValue}">
                            <label for="${this.idGenerico}-max-input" class="gio18112025tag-label">Max:</label>
                            <input type="number" id="${this.idGenerico}-max-input" class="gio18112025tag-input" value="${this.defaultMaxValue}">
                        </div>
                        <div class="gio18112025tagcontenedi">
                            <div class="gio18112025tag-stepinput">
                                <label for="${this.idGenerico}-step-input" class="gio18112025tag-label">Step:</label>
                                <input type="number" id="${this.idGenerico}-step-input" class="gio18112025tag-input" value="${this.defaultStep}" step="any">
                            </div>
                            <button id="${this.idGenerico}-reset-button" class="gio18112025tag-reset-button">Reset</button>
                        </div>
                    </div>
                `;
                this.htmlParent.appendChild(container);
                this.elements.slider = container.querySelector(`#${this.idGenerico}-slider`);
                this.elements.labelValue = container.querySelector(`#${this.idGenerico}-label-value`);
                this.elements.toggleButton = container.querySelector(`#${this.idGenerico}-toggle-button`);
                this.elements.extraControls = container.querySelector(`#${this.idGenerico}-extra-controls`);
                this.elements.resetButton = container.querySelector(`#${this.idGenerico}-reset-button`);
                this.elements.minInput = container.querySelector(`#${this.idGenerico}-min-input`);
                this.elements.maxInput = container.querySelector(`#${this.idGenerico}-max-input`);
                this.elements.stepInput = container.querySelector(`#${this.idGenerico}-step-input`);
                this.elemCheckbox = document.getElementById(`checkbox${this.idGenerico}`);
                this.elemCheckbox.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    this.elements.slider.disabled = !isChecked;
                    this.elements.minInput.disabled = !isChecked;
                    this.elements.maxInput.disabled = !isChecked;
                    this.elements.stepInput.disabled = !isChecked;

                    if (this.checboxInputEvento) {
                        this.checboxInputEvento(isChecked, e);
                    }
                });
            }

            attachEventListeners() {
                if (!this.elements.slider) return;
                this.elements.slider.addEventListener('input', () => this.handleSliderInput());
                this.elements.minInput.addEventListener('input', () => this.handleMinInput());
                this.elements.maxInput.addEventListener('input', () => this.handleMaxInput());
                this.elements.stepInput.addEventListener('input', () => this.handleStepInput());
                this.elements.resetButton.addEventListener('click', () => this.handleReset());
                this.elements.toggleButton.addEventListener('click', () => this.handleToggle());
            }

            handleSliderInput() {
                this.updateSliderValueDisplay();
                this.inputEventCallback(this.elements.slider.value);
            }

            handleMinInput() {
                let newMin = parseFloat(this.elements.minInput.value);
                if (isNaN(newMin)) newMin = this.defaultMinValue;
                this.elements.slider.min = newMin;
                if (parseFloat(this.elements.slider.value) < newMin) {
                    this.elements.slider.value = newMin;
                    this.updateSliderValueDisplay();
                }
                this.inputEventCallback(this.elements.slider.value);
            }

            handleMaxInput() {
                let newMax = parseFloat(this.elements.maxInput.value);
                if (isNaN(newMax)) newMax = this.defaultMaxValue;
                this.elements.slider.max = newMax;
                if (parseFloat(this.elements.slider.value) > newMax) {
                    this.elements.slider.value = newMax;
                    this.updateSliderValueDisplay();
                }
                this.inputEventCallback(this.elements.slider.value);
            }

            handleStepInput() {
                let newStep = parseFloat(this.elements.stepInput.value);
                if (isNaN(newStep) || newStep <= 0) newStep = this.defaultStep;
                this.elements.slider.step = newStep;
                this.inputEventCallback(this.elements.slider.value);
            }

            handleReset() {
                this.elements.slider.min = this.defaultMinValue;
                this.elements.slider.max = this.defaultMaxValue;
                this.elements.slider.value = this.defaultInitialValue;
                this.elements.slider.step = this.defaultStep;
                this.elements.minInput.value = this.defaultMinValue;
                this.elements.maxInput.value = this.defaultMaxValue;
                this.elements.stepInput.value = this.defaultStep;
                this.updateSliderValueDisplay();
                this.inputEventCallback(this.elements.slider.value);
            }

            handleToggle() {
                this.elements.extraControls.classList.toggle('gio18112025tag-controls-visible');
                if (this.elements.extraControls.classList.contains('gio18112025tag-controls-visible')) {
                    this.elements.toggleButton.textContent = 'Hide';
                } else {
                    this.elements.toggleButton.textContent = 'Show';
                }
            }

            updateSliderValueDisplay() {
                if (this.elements.labelValue && this.elements.slider) {
                    this.elements.labelValue.textContent = this.elements.slider.value;
                }
            }

            getValue() {
                return parseFloat(this.elements.slider.value);
            }

            setValue(newValue) {
                this.elements.slider.value = newValue;
                this.updateSliderValueDisplay();
                this.inputEventCallback(this.elements.slider.value);
            }
        }

    
        class CheckboxControl {
            constructor(htmlParent, idGenerico, labelText, initialValue = false, changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.initialValue = initialValue;
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`checboxercss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `checboxercss30dic2025`;
                    styleTag.textContent = `
                        .checkbox-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                        }
                        .checkbox-control-label {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            color: #ffffff;
                            font-size: 0.9rem;
                            cursor: pointer;
                        }
                        .checkbox-control-input {
                            width: 18px;
                            height: 18px;
                            cursor: pointer;
                            accent-color: #007bff; 
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('checkbox-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-checkbox" class="checkbox-control-label">
                        <input type="checkbox" id="${this.idGenerico}-checkbox" class="checkbox-control-input" ${this.initialValue ? 'checked' : ''}>
                        <span>${this.labelText}</span>
                    </label>
                `;
                this.htmlParent.appendChild(container);
                this.elements.checkbox = container.querySelector(`#${this.idGenerico}-checkbox`);
            }

            attachEventListeners() {
                this.elements.checkbox.addEventListener('change', (e) => {
                    this.changeCallback(e.target.checked);
                });
            }

            getValue() {
                return this.elements.checkbox.checked;
            }

            setValue(newValue) {
                this.elements.checkbox.checked = newValue;
                this.changeCallback(newValue);
            }
        }

       
        class NumberInputControl {
            constructor(htmlParent, idGenerico, labelText, initialValue = 0, step = 1, min = null, max = null, inputCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.initialValue = initialValue;
                this.defaultValue = initialValue; 
                this.step = step;
                this.min = min;
                this.max = max;
                this.inputCallback = inputCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`inputNumbercss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `inputNumbercss30dic2025`;
                    styleTag.textContent = `
                        .number-input-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .number-input-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }
                        .number-input-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 80px;
                            font-size: 0.9rem;
                            transition: all 0.2s;
                        }
                        .number-input-input:focus {
                            border-color: #007bff;
                            outline: none;
                        }
                        .number-input-reset-button {
                            display:none; 
                            background: #515151;
                            border: 1px solid #666;
                            color: #ffffff;
                            padding: 4px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .number-input-reset-button:hover {
                            background: #616161;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('number-input-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-number-input" class="number-input-label">${this.labelText}:</label>
                    <input type="number" id="${this.idGenerico}-number-input" class="number-input-input"
                           value="${this.initialValue}" step="${this.step}"
                           ${this.min !== null ? `min="${this.min}"` : ''}
                           ${this.max !== null ? `max="${this.max}"` : ''}>
                    <button id="${this.idGenerico}-reset-button" class="number-input-reset-button">Reset</button>
                `;
                this.htmlParent.appendChild(container);
                this.elements.input = container.querySelector(`#${this.idGenerico}-number-input`);
                this.elements.resetButton = container.querySelector(`#${this.idGenerico}-reset-button`);
            }

            attachEventListeners() {
                this.elements.input.addEventListener('input', (e) => {
                    this.inputCallback(parseFloat(e.target.value));
                });
                this.elements.resetButton.addEventListener('click', () => {
                    this.elements.input.value = this.defaultValue;
                    this.inputCallback(this.defaultValue);
                });
            }

            getValue() {
                return parseFloat(this.elements.input.value);
            }

            setValue(newValue) {
                this.elements.input.value = newValue;
                this.inputCallback(newValue);
            }
        }

 
        class TextInputControl {
            constructor(htmlParent, idGenerico, labelText, initialValue = "", inputCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.initialValue = initialValue;
                this.defaultValue = initialValue; 
                this.inputCallback = inputCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`inputTextcss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `inputTextcss30dic2025`;
                    styleTag.textContent = `
                        .text-input-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .text-input-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }
                        .text-input-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 80%;
                            font-size: 0.9rem;
                            transition: all 0.2s;
                        }
                        .text-input-input:focus {
                            border-color: #007bff;
                            outline: none;
                        }
                        .text-input-reset-button {
                            display:none; 
                            background: #515151;
                            border: 1px solid #666;
                            color: #ffffff;
                            padding: 4px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .text-input-reset-button:hover {
                            background: #616161;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('text-input-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-text-input" class="text-input-label">${this.labelText}:</label>
                    <input type="text" id="${this.idGenerico}-text-input" class="text-input-input" value="${this.initialValue}">
                    <button id="${this.idGenerico}-reset-button" class="text-input-reset-button">Reset</button>
                `;
                this.htmlParent.appendChild(container);
                this.elements.input = container.querySelector(`#${this.idGenerico}-text-input`);
                this.elements.resetButton = container.querySelector(`#${this.idGenerico}-reset-button`);
            }

            attachEventListeners() {
                this.elements.input.addEventListener('input', (e) => {
                    this.inputCallback(e.target.value);
                });
                this.elements.resetButton.addEventListener('click', () => {
                    this.elements.input.value = this.defaultValue;
                    this.inputCallback(this.defaultValue);
                });
            }

            getValue() {
                return this.elements.input.value;
            }

            setValue(newValue) {
                this.elements.input.value = newValue;
                this.inputCallback(newValue);
            }
        }
 
        class SelectControl {
            constructor(htmlParent, idGenerico, labelText, options = [], initialValue = null, changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.options = options; 
                this.initialValue = initialValue;
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`selectcss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `selectcss30dic2025`;
                    styleTag.textContent = `
                        .select-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .select-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }
                        .select-control-select {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            font-size: 0.9rem;
                            cursor: pointer;
                            transition: all 0.2s;
                            appearance: none; 
                            -webkit-appearance: none;
                            -moz-appearance: none;
                            background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13%205.2L146.2%20268.4%2018.8%2074.6c-4.7-4.7-12.2-6.5-17.9-4.5s-9.1%205.7-9.1%2012.3c0%207.2%203.4%2014.2%209.1%2017.9l121.2%20121.2a17.6%2017.6%200%200%200%2025.2%200l121.2-121.2c4.7-4.7%206.5-12.2%204.5-17.9s-5.7-9.1-12.3-9.1h-0.1z%22%2F%3E%3C%2Fsvg%3E'); 
                            background-repeat: no-repeat;
                            background-position: right 8px top 50%;
                            background-size: 12px auto;
                            padding-right: 30px; 
                        }
                        .select-control-select:focus {
                            border-color: #007bff;
                            outline: none;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('select-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-select" class="select-control-label">${this.labelText}:</label>
                    <select id="${this.idGenerico}-select" class="select-control-select"></select>
                `;
                this.htmlParent.appendChild(container);
                this.elements.select = container.querySelector(`#${this.idGenerico}-select`);

                this.options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.text;
                    this.elements.select.appendChild(opt);
                });

                if (this.initialValue) {
                    this.elements.select.value = this.initialValue;
                }
            }

            attachEventListeners() {
                this.elements.select.addEventListener('change', (e) => {
                    this.changeCallback(e.target.value);
                });
            }

            getValue() {
                return this.elements.select.value;
            }

            setValue(newValue) {
                this.elements.select.value = newValue;
                this.changeCallback(newValue);
            }
        }

      
        class ButtonControl {
            constructor(htmlParent, idGenerico, buttonText, clickCallback = () => {}, className = '') {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.buttonText = buttonText;
                this.clickCallback = clickCallback;
                this.className = className; 
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`botoncss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `botoncss30dic2025`;
                    styleTag.textContent = `
                        .button-control-container {
                            margin-bottom: 15px;
                        }
                        .button-control-button {
                            background: #007bff;
                            border: 1px solid #0056b3;
                            color: #ffffff;
                            padding: 8px 15px;
                            border-radius: 4px;
                            font-size: 0.9rem;
                            cursor: pointer;
                            transition: background-color 0.2s, border-color 0.2s;
                        }
                        .button-control-button:hover {
                            background: #0056b3;
                            border-color: #004085;
                        }
                        /* Ejemplo de clase adicional */
                        .button-control-button.danger {
                            background: #dc3545;
                            border-color: #bd2130;
                        }
                        .button-control-button.danger:hover {
                            background: #bd2130;
                            border-color: #a71d2a;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('button-control-container');
                container.innerHTML = `
                    <button id="${this.idGenerico}-button" class="button-control-button ${this.className}">${this.buttonText}</button>
                `;
                this.htmlParent.appendChild(container);
                this.elements.button = container.querySelector(`#${this.idGenerico}-button`);
            }

            attachEventListeners() {
                this.elements.button.addEventListener('click', () => {
                    this.clickCallback();
                });
            }
        }

      
        class TimePickerControl {
            constructor(htmlParent, idGenerico, labelText, initialTime = "12:00", changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.initialTime = initialTime;
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
            }

            css = () => {
                if (!document.getElementById(`timePickerCss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `timePickerCss30dic2025`;
                    styleTag.textContent = `
                        .timepicker-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .timepicker-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }
                        .timepicker-control-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 120px;
                            font-size: 0.9rem;
                            transition: all 0.2s;
                        }
                        .timepicker-control-input:focus {
                            border-color: #007bff;
                            outline: none;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('timepicker-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-time-input" class="timepicker-control-label">${this.labelText}:</label>
                    <input type="time" id="${this.idGenerico}-time-input" class="timepicker-control-input" value="${this.initialTime}">
                `;
                this.htmlParent.appendChild(container);
                this.elements.input = container.querySelector(`#${this.idGenerico}-time-input`);
            }

            attachEventListeners() {
                this.elements.input.addEventListener('change', (e) => {
                    this.changeCallback(e.target.value);
                });
            }

            getValue() {
                return this.elements.input.value;
            }

            setValue(newTime) {
                this.elements.input.value = newTime;
                this.changeCallback(newTime);
            }
        }

      
        class RangeControl {
            constructor(htmlParent, idGenerico, labelText, min = 0, max = 100, initialValue1 = 25, initialValue2 = 75, step = 1, changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.min = min;
                this.max = max;
                this.initialValue1 = initialValue1;
                this.initialValue2 = initialValue2;
                this.step = step;
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
                this.updateDisplay();
            }

            css = () => {
                if (!document.getElementById(`rangeControlCss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `rangeControlCss30dic2025`;
                    styleTag.textContent = `
                        .range-control-container {
                            margin-bottom: 15px;
                        }
                        .range-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                            margin-bottom: 8px;
                            display: block;
                        }
                        .range-control-sliders {
                            position: relative;
                            height: 20px;
                            margin-top: 10px;
                        }
                        .range-control-slider {
                            position: absolute;
                            width: 100%;
                            height: 6px;
                            background: #555;
                            border-radius: 3px;
                            outline: none;
                            pointer-events: none; 
                        }
                        .range-control-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 16px;
                            height: 16px;
                            background: #007bff; 
                            cursor: grab;
                            border-radius: 50%;
                            pointer-events: all; 
                            position: relative;
                            z-index: 2; 
                            border: 1px solid #0056b3;
                        }
                        .range-control-slider::-moz-range-thumb {
                            width: 16px;
                            height: 16px;
                            background: #007bff;
                            cursor: grab;
                            border-radius: 50%;
                            pointer-events: all;
                            position: relative;
                            z-index: 2;
                            border: 1px solid #0056b3;
                        }
                        /* Estilo para el track de progreso entre los thumbs */
                        .range-control-track-highlight {
                            position: absolute;
                            height: 6px;
                            background-color: #007bff; 
                            border-radius: 3px;
                            z-index: 1; 
                            top: 7px; 
                        }
                        .range-control-values {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 10px;
                            color: #aaa;
                            font-size: 0.85rem;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('range-control-container');
                container.innerHTML = `
                    <label class="range-control-label">${this.labelText}: <span id="${this.idGenerico}-display-value"></span></label>
                    <div class="range-control-sliders">
                        <div id="${this.idGenerico}-track-highlight" class="range-control-track-highlight"></div>
                        <input type="range" id="${this.idGenerico}-slider1" class="range-control-slider" min="${this.min}" max="${this.max}" value="${this.initialValue1}" step="${this.step}">
                        <input type="range" id="${this.idGenerico}-slider2" class="range-control-slider" min="${this.min}" max="${this.max}" value="${this.initialValue2}" step="${this.step}">
                    </div>
                    <div class="range-control-values">
                        <span id="${this.idGenerico}-min-display">${this.min}</span>
                        <span id="${this.idGenerico}-max-display">${this.max}</span>
                    </div>
                `;
                this.htmlParent.appendChild(container);

                this.elements.slider1 = container.querySelector(`#${this.idGenerico}-slider1`);
                this.elements.slider2 = container.querySelector(`#${this.idGenerico}-slider2`);
                this.elements.displayValue = container.querySelector(`#${this.idGenerico}-display-value`);
                this.elements.trackHighlight = container.querySelector(`#${this.idGenerico}-track-highlight`);
            }

            attachEventListeners() {
                const updateAndCallback = () => {
                    this.updateDisplay();
                    this.changeCallback(this.getValue());
                };

                this.elements.slider1.addEventListener('input', () => {
                    if (parseFloat(this.elements.slider1.value) > parseFloat(this.elements.slider2.value)) {
                        this.elements.slider1.value = this.elements.slider2.value;
                    }
                    updateAndCallback();
                });

                this.elements.slider2.addEventListener('input', () => {
                    if (parseFloat(this.elements.slider2.value) < parseFloat(this.elements.slider1.value)) {
                        this.elements.slider2.value = this.elements.slider1.value;
                    }
                    updateAndCallback();
                });
            }

            updateDisplay() {
                let val1 = parseFloat(this.elements.slider1.value);
                let val2 = parseFloat(this.elements.slider2.value);

                const currentMin = Math.min(val1, val2);
                const currentMax = Math.max(val1, val2);

                this.elements.displayValue.textContent = `${currentMin} - ${currentMax}`;

                const totalRange = this.max - this.min;
                const leftPercent = ((currentMin - this.min) / totalRange) * 100;
                const widthPercent = ((currentMax - currentMin) / totalRange) * 100;

                this.elements.trackHighlight.style.left = `${leftPercent}%`;
                this.elements.trackHighlight.style.width = `${widthPercent}%`;
            }

            getValue() {
                return {
                    value1: parseFloat(this.elements.slider1.value),
                    value2: parseFloat(this.elements.slider2.value)
                };
            }

            setValue(newValue1, newValue2) {
                newValue1 = Math.max(this.min, Math.min(this.max, newValue1));
                newValue2 = Math.max(this.min, Math.min(this.max, newValue2));

                this.elements.slider1.value = newValue1;
                this.elements.slider2.value = newValue2;
                this.updateDisplay();
                this.changeCallback(this.getValue());
            }
        }

        
        class ColorPickerControl {
            constructor(htmlParent, idGenerico, labelText, initialColor = "#007bff", changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.initialColor = initialColor;
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
                this.updateDisplayColor();
            }

            css = () => {
                if (!document.getElementById(`colorPickerCss30dic2025`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `colorPickerCss30dic2025`;
                    styleTag.textContent = `
                        .colorpicker-control-container {
                            margin-bottom: 15px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .colorpicker-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                        }
                        .colorpicker-control-input {
                            -webkit-appearance: none;
                            -moz-appearance: none;
                            appearance: none;
                            width: 40px; 
                            height: 40px;
                            background-color: transparent;
                            border: none;
                            cursor: pointer;
                            padding: 0;
                        }
                        .colorpicker-control-input::-webkit-color-swatch-wrapper {
                            padding: 0;
                        }
                        .colorpicker-control-input::-webkit-color-swatch {
                            border: 1px solid #555;
                            border-radius: 4px;
                        }
                        .colorpicker-control-input::-moz-color-swatch-wrapper {
                            padding: 0;
                        }
                        .colorpicker-control-input::-moz-color-swatch {
                            border: 1px solid #555;
                            border-radius: 4px;
                        }
                        .colorpicker-control-text-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 90px;
                            font-size: 0.9rem;
                            transition: all 0.2s;
                            text-transform: uppercase; 
                        }
                        .colorpicker-control-text-input:focus {
                            border-color: #007bff;
                            outline: none;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('colorpicker-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-color-input" class="colorpicker-control-label">${this.labelText}:</label>
                    <input type="color" id="${this.idGenerico}-color-input" class="colorpicker-control-input" value="${this.initialColor}">
                    <input type="text" id="${this.idGenerico}-text-input" class="colorpicker-control-text-input" value="${this.initialColor.toUpperCase()}">
                `;
                this.htmlParent.appendChild(container);
                this.elements.colorInput = container.querySelector(`#${this.idGenerico}-color-input`);
                this.elements.textInput = container.querySelector(`#${this.idGenerico}-text-input`);
            }

            attachEventListeners() {
                this.elements.colorInput.addEventListener('input', (e) => {
                    const color = e.target.value;
                    this.elements.textInput.value = color.toUpperCase();
                    this.changeCallback(color);
                });

                this.elements.textInput.addEventListener('input', (e) => {
                    let color = e.target.value;
                    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                        this.elements.colorInput.value = color;
                        this.changeCallback(color);
                    }
                });

                this.elements.textInput.addEventListener('blur', () => {
                    this.elements.textInput.value = this.elements.colorInput.value.toUpperCase();
                });
            }

            updateDisplayColor() {
                this.elements.colorInput.value = this.initialColor;
                this.elements.textInput.value = this.initialColor.toUpperCase();
            }

            getValue() {
                return this.elements.colorInput.value;
            }

            setValue(newColor) {
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
                    this.elements.colorInput.value = newColor;
                    this.elements.textInput.value = newColor.toUpperCase();
                    this.changeCallback(newColor);
                } else {
                    console.warn("ColorPickerControl: El formato de color no es HEX válido. Se espera #RRGGBB o #RGB.");
                }
            }
        }

      
        class CalendarControl {
            constructor(htmlParent, idGenerico, labelText, initialDate = new Date(), changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.selectedDate = this.normalizeDate(initialDate); 
                this.currentMonth = this.selectedDate.getMonth();
                this.currentYear = this.selectedDate.getFullYear();
                this.changeCallback = changeCallback;
                this.elements = {};

                this.css();
                this.createElements();
                this.attachEventListeners();
                this.renderCalendar();
            }

            css = () => {
                if (!document.getElementById(`calendarControlCss`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `calendarControlCss`;
                    styleTag.textContent = `
                        .calendar-control-container {
                            margin-bottom: 15px;
                            position: relative;
                        }
                        .calendar-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                            margin-bottom: 8px;
                            display: block;
                        }
                        .calendar-display-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 150px;
                            font-size: 0.9rem;
                            cursor: pointer;
                            position: relative;
                            z-index: 0;
                        }
                        .calendar-popup {
                            position: absolute;
                            background-color: #444;
                            border: 1px solid #666;
                            border-radius: 8px;
                            padding: 15px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                            z-index: 1000;
                            display: none; /* Oculto por defecto */
                            top: 100%; /* Aparece debajo del input */
                            left: 0;
                            margin-top: 5px;
                        }
                        .calendar-popup.open {
                            display: block;
                        }
                        .calendar-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        .calendar-header button {
                            background: #515151;
                            border: 1px solid #666;
                            color: #ffffff;
                            padding: 5px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .calendar-header button:hover {
                            background: #616161;
                        }
                        .calendar-title {
                            color: #ffffff;
                            font-weight: bold;
                        }
                        .calendar-grid {
                            display: grid;
                            grid-template-columns: repeat(7, 1fr);
                            gap: 5px;
                            text-align: center;
                        }
                        .calendar-day-header {
                            color: #aaa;
                            font-size: 0.8em;
                        }
                        .calendar-day {
                            padding: 8px 5px;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: background-color 0.2s;
                            font-size: 0.9em;
                        }
                        .calendar-day:hover:not(.empty):not(.disabled):not(.selected) {
                            background-color: #555;
                        }
                        .calendar-day.empty {
                            visibility: hidden;
                        }
                        .calendar-day.current-month {
                            color: #eee;
                        }
                        .calendar-day.other-month {
                            color: #888;
                        }
                        .calendar-day.selected {
                            background-color: #007bff;
                            color: #fff;
                            font-weight: bold;
                        }
                        .calendar-day.today {
                            border: 1px solid #007bff;
                        }
                        .calendar-day.disabled {
                            color: #666;
                            cursor: not-allowed;
                            background-color: #383838;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('calendar-control-container');
                container.innerHTML = `
                    <label for="${this.idGenerico}-date-input" class="calendar-control-label">${this.labelText}:</label>
                    <input type="text" id="${this.idGenerico}-date-input" class="calendar-display-input" readonly value="${this.formatDate(this.selectedDate)}">
                    <div id="${this.idGenerico}-calendar-popup" class="calendar-popup">
                        <div class="calendar-header">
                            <button id="${this.idGenerico}-prev-month">&lt;</button>
                            <span id="${this.idGenerico}-month-year" class="calendar-title"></span>
                            <button id="${this.idGenerico}-next-month">&gt;</button>
                        </div>
                        <div class="calendar-grid">
                            <div class="calendar-day-header">Dom</div>
                            <div class="calendar-day-header">Lun</div>
                            <div class="calendar-day-header">Mar</div>
                            <div class="calendar-day-header">Mié</div>
                            <div class="calendar-day-header">Jue</div>
                            <div class="calendar-day-header">Vie</div>
                            <div class="calendar-day-header">Sáb</div>
                        </div>
                    </div>
                `;
                this.htmlParent.appendChild(container);

                this.elements.displayInput = container.querySelector(`#${this.idGenerico}-date-input`);
                this.elements.calendarPopup = container.querySelector(`#${this.idGenerico}-calendar-popup`);
                this.elements.prevMonthBtn = container.querySelector(`#${this.idGenerico}-prev-month`);
                this.elements.nextMonthBtn = container.querySelector(`#${this.idGenerico}-next-month`);
                this.elements.monthYearSpan = container.querySelector(`#${this.idGenerico}-month-year`);
                this.elements.calendarGrid = container.querySelector(`.calendar-grid`);
            }

            attachEventListeners() {
                this.elements.displayInput.addEventListener('click', () => {
                    this.elements.calendarPopup.classList.toggle('open');
                    this.renderCalendar();  
                });

                this.elements.prevMonthBtn.addEventListener('click', () => {
                    this.changeMonth(-1);
                });

                this.elements.nextMonthBtn.addEventListener('click', () => {
                    this.changeMonth(1);
                });

              
                document.addEventListener('click', (event) => {
                    if (!this.htmlParent.contains(event.target)) {
                        this.elements.calendarPopup.classList.remove('open');
                    }
                });
            }

            renderCalendar() {
                this.elements.calendarGrid.querySelectorAll('.calendar-day:not(.calendar-day-header)').forEach(day => day.remove());

                const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
                const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
                const startDay = firstDayOfMonth.getDay();  

                this.elements.monthYearSpan.textContent = `${firstDayOfMonth.toLocaleString('es-ES', { month: 'long' })} ${this.currentYear}`;

                 
                for (let i = 0; i < startDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.classList.add('calendar-day', 'empty');
                    this.elements.calendarGrid.appendChild(emptyDay);
                }

         
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayElement = document.createElement('div');
                    dayElement.classList.add('calendar-day', 'current-month');
                    dayElement.textContent = day;
                    dayElement.dataset.date = new Date(this.currentYear, this.currentMonth, day).toDateString();

                    const currentDayDate = new Date(this.currentYear, this.currentMonth, day);
                    const today = this.normalizeDate(new Date());

                    if (currentDayDate.getTime() === this.selectedDate.getTime()) {
                        dayElement.classList.add('selected');
                    }
                    if (currentDayDate.getTime() === today.getTime()) {
                        dayElement.classList.add('today');
                    }

                    dayElement.addEventListener('click', () => this.selectDate(day));
                    this.elements.calendarGrid.appendChild(dayElement);
                }
            }

            changeMonth(offset) {
                this.currentMonth += offset;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                } else if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
            }

            selectDate(day) {
                this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
                this.elements.displayInput.value = this.formatDate(this.selectedDate);
                this.elements.calendarPopup.classList.remove('open');
                this.changeCallback(this.selectedDate);
                this.renderCalendar();  
            }

            formatDate(date) {
                return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            normalizeDate(date) {
              
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d;
            }

            getValue() {
                return this.selectedDate;
            }

            setValue(newDate) {
                this.selectedDate = this.normalizeDate(newDate);
                this.currentMonth = this.selectedDate.getMonth();
                this.currentYear = this.selectedDate.getFullYear();
                this.elements.displayInput.value = this.formatDate(this.selectedDate);
                this.renderCalendar();
                this.changeCallback(this.selectedDate);
            }
        }

       
        class DateRangeControl {
            constructor(htmlParent, idGenerico, labelText, initialStartDate = new Date(), initialEndDate = new Date(), changeCallback = () => {}) {
                this.htmlParent = htmlParent;
                this.idGenerico = idGenerico;
                this.labelText = labelText;
                this.startDate = this.normalizeDate(initialStartDate);
                this.endDate = this.normalizeDate(initialEndDate);
                this.currentMonth = this.startDate.getMonth();
                this.currentYear = this.startDate.getFullYear();
                this.changeCallback = changeCallback;
                this.elements = {};
                this.selectingStartDate = true; 
                this.css();
                this.createElements();
                this.attachEventListeners();
                this.renderCalendar();
            }

            css = () => {
                if (!document.getElementById(`dateRangeControlCss`)) {
                    const styleTag = document.createElement('style');
                    styleTag.id = `dateRangeControlCss`;
                    styleTag.textContent = `
                        .date-range-control-container {
                            margin-bottom: 15px;
                            position: relative;
                        }
                        .date-range-control-label {
                            color: #ffffff;
                            font-size: 0.9rem;
                            margin-bottom: 8px;
                            display: block;
                        }
                        .date-range-display-inputs {
                            display: flex;
                            gap: 10px;
                            margin-bottom: 5px;
                        }
                        .date-range-display-input {
                            background: #313131;
                            border: 1px solid #555;
                            color: #ffffff;
                            padding: 6px 10px;
                            border-radius: 4px;
                            width: 120px; /* Ajustar el ancho */
                            font-size: 0.9rem;
                            cursor: pointer;
                            position: relative;
                            z-index: 0;
                        }
                        .date-range-display-input.active-selection {
                            border-color: #007bff;
                            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                        }
                        .date-range-popup {
                            position: absolute;
                            background-color: #444;
                            border: 1px solid #666;
                            border-radius: 8px;
                            padding: 15px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                            z-index: 1000;
                            display: none; 
                            top: 100%; 
                            left: 0;
                            margin-top: 5px;
                        }
                        .date-range-popup.open {
                            display: block;
                        }
                        .date-range-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        .date-range-header button {
                            background: #515151;
                            border: 1px solid #666;
                            color: #ffffff;
                            padding: 5px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .date-range-header button:hover {
                            background: #616161;
                        }
                        .date-range-title {
                            color: #ffffff;
                            font-weight: bold;
                        }
                        .date-range-grid {
                            display: grid;
                            grid-template-columns: repeat(7, 1fr);
                            gap: 5px;
                            text-align: center;
                        }
                        .date-range-day-header {
                            color: #aaa;
                            font-size: 0.8em;
                        }
                        .date-range-day {
                            padding: 8px 5px;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: background-color 0.2s;
                            font-size: 0.9em;
                        }
                        .date-range-day:hover:not(.empty):not(.disabled):not(.selected-start):not(.selected-end):not(.in-range) {
                            background-color: #555;
                        }
                        .date-range-day.empty {
                            visibility: hidden;
                        }
                        .date-range-day.current-month {
                            color: #eee;
                        }
                        .date-range-day.other-month {
                            color: #888;
                        }
                        .date-range-day.selected-start {
                            background-color: #007bff;
                            color: #fff;
                            font-weight: bold;
                            border-top-left-radius: 4px;
                            border-bottom-left-radius: 4px;
                            border-top-right-radius: 0;
                            border-bottom-right-radius: 0;
                        }
                        .date-range-day.selected-end {
                            background-color: #007bff;
                            color: #fff;
                            font-weight: bold;
                            border-top-right-radius: 4px;
                            border-bottom-right-radius: 4px;
                            border-top-left-radius: 0;
                            border-bottom-left-radius: 0;
                        }
                        .date-range-day.selected-start.selected-end { /* Si es el mismo día */
                            border-radius: 4px;
                        }
                        .date-range-day.in-range {
                            background-color: rgba(0, 123, 255, 0.3); /* Color semi-transparente para el rango */
                            color: #eee;
                            border-radius: 0;
                        }
                        .date-range-day.today {
                            border: 1px solid #007bff;
                        }
                        .date-range-day.disabled {
                            color: #666;
                            cursor: not-allowed;
                            background-color: #383838;
                        }
                    `;
                    document.head.appendChild(styleTag);
                }
            }

            createElements() {
                const container = document.createElement('div');
                container.classList.add('date-range-control-container');
                container.innerHTML = `
                    <label class="date-range-control-label">${this.labelText}:</label>
                    <div class="date-range-display-inputs">
                        <input type="text" id="${this.idGenerico}-start-date-input" class="date-range-display-input" readonly value="${this.formatDate(this.startDate)}">
                        <span>-</span>
                        <input type="text" id="${this.idGenerico}-end-date-input" class="date-range-display-input" readonly value="${this.formatDate(this.endDate)}">
                    </div>
                    <div id="${this.idGenerico}-date-range-popup" class="date-range-popup">
                        <div class="date-range-header">
                            <button id="${this.idGenerico}-prev-month">&lt;</button>
                            <span id="${this.idGenerico}-month-year" class="date-range-title"></span>
                            <button id="${this.idGenerico}-next-month">&gt;</button>
                        </div>
                        <div class="date-range-grid">
                            <div class="date-range-day-header">Dom</div>
                            <div class="date-range-day-header">Lun</div>
                            <div class="date-range-day-header">Mar</div>
                            <div class="date-range-day-header">Mié</div>
                            <div class="date-range-day-header">Jue</div>
                            <div class="date-range-day-header">Vie</div>
                            <div class="date-range-day-header">Sáb</div>
                        </div>
                    </div>
                `;
                this.htmlParent.appendChild(container);

                this.elements.startDateInput = container.querySelector(`#${this.idGenerico}-start-date-input`);
                this.elements.endDateInput = container.querySelector(`#${this.idGenerico}-end-date-input`);
                this.elements.dateRangePopup = container.querySelector(`#${this.idGenerico}-date-range-popup`);
                this.elements.prevMonthBtn = container.querySelector(`#${this.idGenerico}-prev-month`);
                this.elements.nextMonthBtn = container.querySelector(`#${this.idGenerico}-next-month`);
                this.elements.monthYearSpan = container.querySelector(`#${this.idGenerico}-month-year`);
                this.elements.calendarGrid = container.querySelector(`.date-range-grid`);
            }

            attachEventListeners() {
                this.elements.startDateInput.addEventListener('click', () => {
                    this.selectingStartDate = true;
                    this.elements.startDateInput.classList.add('active-selection');
                    this.elements.endDateInput.classList.remove('active-selection');
                    this.elements.dateRangePopup.classList.add('open');
                    this.currentMonth = this.startDate.getMonth();
                    this.currentYear = this.startDate.getFullYear();
                    this.renderCalendar();
                });

                this.elements.endDateInput.addEventListener('click', () => {
                    this.selectingStartDate = false;
                    this.elements.endDateInput.classList.add('active-selection');
                    this.elements.startDateInput.classList.remove('active-selection');
                    this.elements.dateRangePopup.classList.add('open');
                    this.currentMonth = this.endDate.getMonth();
                    this.currentYear = this.endDate.getFullYear();
                    this.renderCalendar();
                });

                this.elements.prevMonthBtn.addEventListener('click', () => {
                    this.changeMonth(-1);
                });

                this.elements.nextMonthBtn.addEventListener('click', () => {
                    this.changeMonth(1);
                });

                document.addEventListener('click', (event) => {
                    if (!this.htmlParent.contains(event.target)) {
                        this.elements.dateRangePopup.classList.remove('open');
                        this.elements.startDateInput.classList.remove('active-selection');
                        this.elements.endDateInput.classList.remove('active-selection');
                    }
                });
            }

            renderCalendar() {
                this.elements.calendarGrid.querySelectorAll('.date-range-day:not(.date-range-day-header)').forEach(day => day.remove());

                const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
                const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
                const startDay = firstDayOfMonth.getDay(); 

                this.elements.monthYearSpan.textContent = `${firstDayOfMonth.toLocaleString('es-ES', { month: 'long' })} ${this.currentYear}`;

                for (let i = 0; i < startDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.classList.add('date-range-day', 'empty');
                    this.elements.calendarGrid.appendChild(emptyDay);
                }

                const today = this.normalizeDate(new Date());

                for (let day = 1; day <= daysInMonth; day++) {
                    const dayElement = document.createElement('div');
                    dayElement.classList.add('date-range-day', 'current-month');
                    dayElement.textContent = day;
                    const currentDayDate = new Date(this.currentYear, this.currentMonth, day);

                    if (currentDayDate.getTime() === today.getTime()) {
                        dayElement.classList.add('today');
                    }
                    
                    if (currentDayDate.getTime() === this.startDate.getTime() && currentDayDate.getTime() === this.endDate.getTime()) {
                        dayElement.classList.add('selected-start', 'selected-end');
                    } else if (currentDayDate.getTime() === this.startDate.getTime()) {
                        dayElement.classList.add('selected-start');
                    } else if (currentDayDate.getTime() === this.endDate.getTime()) {
                        dayElement.classList.add('selected-end');
                    } else if (currentDayDate > this.startDate && currentDayDate < this.endDate) {
                        dayElement.classList.add('in-range');
                    }

                    dayElement.addEventListener('click', () => this.selectDate(day));
                    this.elements.calendarGrid.appendChild(dayElement);
                }
            }

            changeMonth(offset) {
                this.currentMonth += offset;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                } else if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
            }

            selectDate(day) {
                const newDate = this.normalizeDate(new Date(this.currentYear, this.currentMonth, day));

                if (this.selectingStartDate) {
                    this.startDate = newDate;
                    if (this.startDate > this.endDate) {  
                        this.endDate = this.startDate;
                    }
                    this.elements.startDateInput.value = this.formatDate(this.startDate);
           
                    this.selectingStartDate = false;
                    this.elements.startDateInput.classList.remove('active-selection');
                    this.elements.endDateInput.classList.add('active-selection');
                } else {
                    this.endDate = newDate;
                    if (this.endDate < this.startDate) { 
                        this.startDate = this.endDate;
                    }
                    this.elements.endDateInput.value = this.formatDate(this.endDate);
              
                    this.elements.dateRangePopup.classList.remove('open');
                    this.elements.endDateInput.classList.remove('active-selection');
                    this.selectingStartDate = true; 
                }
                this.renderCalendar();  
                this.changeCallback({ startDate: this.startDate, endDate: this.endDate });
            }

            formatDate(date) {
                if (!date) return '';  
                return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            normalizeDate(date) {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d;
            }

            getValue() {
                return { startDate: this.startDate, endDate: this.endDate };
            }

            setValue(newStartDate, newEndDate) {
                this.startDate = this.normalizeDate(newStartDate);
                this.endDate = this.normalizeDate(newEndDate);
     
                if (this.startDate > this.endDate) {
                    [this.startDate, this.endDate] = [this.endDate, this.startDate];
                }
                this.currentMonth = this.startDate.getMonth();
                this.currentYear = this.startDate.getFullYear();
                this.elements.startDateInput.value = this.formatDate(this.startDate);
                this.elements.endDateInput.value = this.formatDate(this.endDate);
                this.renderCalendar();
                this.changeCallback(this.getValue());
            }
        }



        class HexagonalButton {
    constructor(htmlParent, idGenerico, buttonText, clickCallback = () => {}) {
        this.htmlParent = htmlParent;
        this.idGenerico = idGenerico;
        this.buttonText = buttonText;
        this.clickCallback = clickCallback;
        this.elements = {};

        this.css();
        this.createElements();
        this.attachEventListeners();
    }

    css = () => {
        if (!document.getElementById(`hexagonalButtonCss30dic2025`)) {
            const styleTag = document.createElement('style');
            styleTag.id = `hexagonalButtonCss30dic2025`;
            styleTag.textContent = `
                .hexagonal-button-container {
                    margin-bottom: 15px;
                    display: inline-block;
                }
                
                .hexagonal-button {
                    position: relative;
                    width: 80px;
                    height: 70px;
                    background: #007bff;
                    color: #ffffff;
                    border: none;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: bold;
                    text-align: center;
                    transition: all 0.3s ease;
                    clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
                }
                
                .hexagonal-button:hover {
                    background: #0056b3;
                    transform: scale(1.05);
                }
                
                .hexagonal-button:active {
                    transform: scale(0.95);
                }
                
                .hexagonal-button.danger {
                    background: #dc3545;
                }
                
                .hexagonal-button.danger:hover {
                    background: #bd2130;
                }
                
                .hexagonal-button.success {
                    background: #28a745;
                }
                
                .hexagonal-button.success:hover {
                    background: #218838;
                }
                
                .hexagonal-button.warning {
                    background: #ffc107;
                    color: #212529;
                }
                
                .hexagonal-button.warning:hover {
                    background: #e0a800;
                }
            `;
            document.head.appendChild(styleTag);
        }
    }

    createElements() {
        const container = document.createElement('div');
        container.classList.add('hexagonal-button-container');
        container.innerHTML = `
            <button id="${this.idGenerico}-hexbutton" class="hexagonal-button">${this.buttonText}</button>
        `;
        this.htmlParent.appendChild(container);
        this.elements.button = container.querySelector(`#${this.idGenerico}-hexbutton`);
    }

    attachEventListeners() {
        this.elements.button.addEventListener('click', () => {
            this.clickCallback();
        });
    }

    setStyle(className) {
        this.elements.button.className = 'hexagonal-button ' + className;
    }
}









/*  */

 
    class InputSimple {
    constructor(parentHtml, idGenerico, labelText, inputValue = '', inputType = 'text', eventCallback = () => {}, inputClass = '', minValue = null, maxValue = null) {
        this.css();
        this.parentHtml = parentHtml;
        this.idGenerico = idGenerico;

        this.divParent = document.createElement('div');
        this.divParent.classList.add('form-control-row');
        this.divParent.id = `${idGenerico}-parent`;

        this.label = document.createElement('label');
        this.label.htmlFor = `${idGenerico}-input`;
        this.label.textContent = labelText;
        this.divParent.appendChild(this.label);

        this.input = document.createElement('input');
        this.input.id = `${idGenerico}-input`;
        this.input.value = inputValue !== null ? String(inputValue) : '';

        switch (inputType.toLowerCase()) {
            case 'number':
            case 'int':
                this.input.type = 'number';
                this.input.step = '1';
                break;
            case 'float':
                this.input.type = 'number';
                this.input.step = 'any';
                break;
            case 'text':
            default:
                this.input.type = 'text';
                break;
        }

        // Agregar min y max si se proporcionan
        if (minValue !== null && this.input.type === 'number') {
            this.input.min = minValue;
        }
        if (maxValue !== null && this.input.type === 'number') {
            this.input.max = maxValue;
        }

        if (inputClass) {
            this.input.classList.add(inputClass);
        } else {
            this.input.classList.add('default-input-style');
        }
        this.divParent.appendChild(this.input);

        this.parentHtml.appendChild(this.divParent);

        this.input.oninput = (e) => {
            if (eventCallback) {
                let valueToPass = this.input.value;

                if (this.input.type === 'number') {
                    if (inputType.toLowerCase() === 'int') {
                        if (/^-?\d*$/.test(valueToPass)) {
                             valueToPass = parseInt(valueToPass, 10);
                             if (isNaN(valueToPass)) valueToPass = '';
                        }
                    } else if (inputType.toLowerCase() === 'float') {
                        if (/^-?\d*\.?\d*$/.test(valueToPass)) {
                             valueToPass = parseFloat(valueToPass);
                             if (isNaN(valueToPass)) valueToPass = '';
                        }
                    }
                }
                eventCallback(valueToPass, this.input, e);
            }
        };
    }

    css = () => {
        if (!document.getElementById("form-control-row-css")) {
            const styleTag = document.createElement('style');
            styleTag.id = "form-control-row-css";
            styleTag.textContent = `
                .form-control-row {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    align-content: center;
                    margin: 15px 0;
                    padding: 12px;
                    background-color: #313131;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .form-control-row:hover {
                    background-color: #3a3a3a;
                }

                .form-control-row label {
                    flex-shrink: 0;
                    margin-right: 12px;
                    font-size: 15px;
                    color: #ffffff;
                    font-weight: 500;
                }

                .form-control-row input.default-input-style {
                    flex-grow: 1;
                    padding: 10px 12px;
                    border: 2px solid #252525;
                    border-radius: 6px;
                    box-sizing: border-box;
                    width: 100%;
                    background-color: #252525;
                    color: #ffffff;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .form-control-row input.default-input-style:focus {
                    outline: none;
                    border-color: #4a90e2;
                    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
                }

                .bpm-input,
                .global-measure-input {
                    width: 70px;
                    padding: 8px;
                    background: #252525;
                    border: 2px solid #313131;
                    color: #ffffff;
                    border-radius: 6px;
                    text-align: center;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }

                .bpm-input:focus,
                .global-measure-input:focus {
                    outline: none;
                    border-color: #4a90e2;
                    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
                }
            `;
            document.head.appendChild(styleTag);
        }
    }

    getValue() {
        const currentType = this.input.type;
        const inputValue = this.input.value;

        if (inputValue.trim() === '') return '';

        if (currentType === 'number') {
            if (this.input.step === 'any') {
                const parsed = parseFloat(inputValue);
                return isNaN(parsed) ? inputValue : parsed;
            } else {
                const parsed = parseInt(inputValue, 10);
                return isNaN(parsed) ? inputValue : parsed;
            }
        }
        return inputValue;
    }

    setValue(newValue) {
        this.input.value = newValue !== null ? String(newValue) : '';
    }
}
 
