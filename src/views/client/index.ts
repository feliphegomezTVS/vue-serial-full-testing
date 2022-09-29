import { Peer } from "peerjs";
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {
serial as polyfill, SerialPort as SerialPortPolyfill,
} from 'web-serial-polyfill';

declare class PortOption extends HTMLOptionElement {
    port: SerialPort | SerialPortPolyfill;
}

export class LineBreakTransformer {
    constructor() {
      // A container for holding stream data until a new line.
      this.container = '';
    }
  
    transform(chunk, controller) {
        // Handle incoming chunk
        this.container += chunk;
        // const lines = this.container.split('X');
        // const lines = this.container.split('\r\n');
        const lines = this.container.split(/[\s,\r,\n,x,X]/);
        this.container = lines.pop();
        lines.forEach(line => controller.enqueue(line));
    }
  
    flush(controller) {
      // Flush the stream.
      controller.enqueue(this.container);
    }
} 

const utils = {
    methods: {
        addZero(t) {
            if (t < 10) t = "0" + t;
            return t;
        },
        isAbv(value) {
            return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
        },
    }
};

export default {
    mixins: [utils],
    data() {
        return {
            /* Data SerialPort */
            FG: {
                portSelector: HTMLSelectElement || undefined,
                connectButton: HTMLButtonElement || undefined,
                baudRateSelector: HTMLSelectElement || undefined,
                customBaudRateInput: HTMLInputElement || undefined,
                dataBitsSelector: HTMLSelectElement || undefined,
                paritySelector: HTMLSelectElement || undefined,
                stopBitsSelector: HTMLSelectElement || undefined,
                flowControlCheckbox: HTMLInputElement || undefined,
                echoCheckbox: HTMLInputElement || undefined,
                flushOnEnterCheckbox: HTMLInputElement || undefined,
                autoconnectCheckbox: HTMLInputElement || undefined,
                portCounter: 1,
                // port: SerialPort || SerialPortPolyfill || undefined,
                port: undefined,
                ports: [],
                reader: ReadableStreamDefaultReader || ReadableStreamBYOBReader || undefined,
                urlParams: new URLSearchParams(window.location.search),
                usePolyfill: new URLSearchParams(window.location.search).has('polyfill'),
                bufferSize: 8 * 1024, // 8Kb
                term: new Terminal({
                    scrollback: 10_000,
                }),
                fitAddon: new FitAddon(),
                encoder: new TextEncoder(),
                toFlush: '',
                terminalElement: HTMLInputElement || undefined,
            },
            /* Data Peer */
            connection: {
                config: {
                    debug: 2
                },
                conn: null,
                lastPeerId: String || null || undefined,
                peer: Peer || undefined,
                peerId: '' || null, // Revisar ya que probablemente no se use
                recvId: '',
                status: '',
                statusCode: 9999,
                message: '',
                messages: [],
            },
            /* Filters */
            CANCounterGUI: 0,
            dinf: {
                a: "7DF80201429999999999",
                b: "pauseIPafterThisMessage",
                c: "pauseIPinstant",
                d: "pauseFlashBlockArrayafterThisMessage",
                e: "0028991200000000",
                f: "00189900000000000083",
                g: "full Reset",
                h: "70080211019999999999",
                i: "70080214009999999999",
                j: "7008023E009999999999",
                k: "unpauseIP",
                l: "skippauseIPinstant",
                m: "recallLastFlashBlock",
                n: "blockCANBUSMessage",
                o: "00189900000000000083",
            },
            info: {
            a: /^001([0-9A-F]){0,17}|^200([0-9A-F]){0,17}|^201([0-9A-F]){0,17}|^301([0-9A-F]){0,17}|^300([0-9A-F]){0,17}|^7([0-9A-F]){0,19}|^6([0-9A-F]){0,19}$/,
            b: /^7([0-9A-F]){0,2}80([0-9])([0-9A-F]){0,14}$/,
            c: /^7([0-9A-F]){0,3}0([0-9A-F]){0,1}04([0-9A-F]){0,12}|^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^7([0-9A-F]){0,3}023E([0-9A-F]){0,12}|^7DF([0-9A-F]){0,17}|^700([0-9A-F]){0,17}$/,
            d: /^7([0-9A-F]){0,2}81([0-9A-F]){0,3}36([0-9A-F]){0,10}|^7([0-9A-F]){0,2}80([0-9A-F]){0,1}37([0-9A-F]){0,12}$/,
            e: /^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}|^7([0-9A-F]){0,2}80([0-9A-F]){0,1}74([0-9A-F]){0,12}$/,
            f: /^001([0-9A-F]){0,17}|^7([0-9A-F]){0,3}3([0-9A-F]){0,13}|^([0-6]){0,1}([0-9A-F]){0,19}$/,
            g: /^001([0-9A-F]){0,17}|^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^700([0-9A-F]){0,17}|^7([0-9A-F]){0,3}023E80([0-9A-F]){0,10}$/,
            h: /^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^700([0-9A-F]){0,17},$/,
            i: /^7([0-9A-F]){0,3}1([0-9A-F]){0,3}36([0-9A-F]){0,10}$/,
            j: /^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}$/,
            k: /^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}$/,
            l: /^7([0-9A-F]){0,3}3([0-9A-F]){0,15}$/,
            m: /^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}|^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}$/,
            n: /^7([0-9A-F]){0,2}80([0-9A-F]){0,1}74([0-9A-F]){0,12}$/,
            o: 0,
            p: null,
            q: 150,
            r: /^7([0-9A-F]){0,3}0([0-9A-F]){0,1}5003([0-9A-F]){0,10}$/,
            s: /^7([0-9A-F]){0,3}0([0-9A-F]){0,1}51([0-9A-F]){0,12}|^7([0-9A-F]){0,3}0([0-9A-F]){0,1}11([0-9A-F]){0,12}$/,
            t: /^7E([0-9A-F]){0,1}8044142([0-9A-F]){0,10}$/,
            y: /^7([0-9A-F]){0,2}83([0-9A-F]){0,15}|^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}|^7([0-9A-F]){0,3}037F0111([0-9A-F]){0,8}|^7([0-9A-F]){0,3}037F([0-9A-F]){0,2}78([0-9A-F]){0,8}|^7([0-9A-F]){0,3}0([0-9A-F]){0,1}76([0-9A-F]){0,12}$/,
            },
        };
    },
    computed: {
        peerConnected(): boolean {
            try {
                return true; // debug
                return (this.connection.conn && this.connection.status == 'connected' && this.connection.peerId.length>10) ? true : false;
            } catch(e) {
                console.log(e)
            }
            return false;
        },
        classStatus() {
            if(this.connection.status == 'connected') return 'success';
            else if(this.connection.status == 'reset-awaiting' || this.connection.status == 'destroyed' || this.connection.status == 'lost') return 'danger';
            else if(this.connection.status == 'awaiting') return 'warning';
            else return "secondary";
        }
    },
    created() {
        //  Deletes
        // this.port = SerialPort || SerialPortPolyfill;
        // this.usePolyfill = this.urlParams.has('polyfill');
    },
    mounted() {
        let self = this;
        console.log('mounted')
        
        this.initPeer();
        // this.initSW();
        // this.initTerminal();
        this.initTerminal();
    },
    methods: {
        initPeer() {
            console.log('init Peer');
            // var standbyBox = document.getElementById("standby"); // v-model
            // var goBox = document.getElementById("go"); // v-model
            // var fadeBox = document.getElementById("fade"); // v-model
            // var offBox = document.getElementById("off"); // v-model
            this.connection.peer = new Peer(null, this.connection.config);
            this.connection.peer.on('open', this.connOpen);
            this.connection.peer.on('connection', this.connUniqueLimit);
            this.connection.peer.on('disconnected', this.connDisconnected );
            this.connection.peer.on('close', this.connDestroyed);
            this.connection.peer.on('error', this.connError);
        },
        inputData(data) {
            let self = this;
            console.log("Data recieved");
            var cueString = "Command: ";
            switch (data) {
                case 'Go':
                    this.go();
                    this.addMessage('Peer', cueString + data);
                    break;
                case 'Fade':
                    this.fade();
                    this.addMessage('Peer', cueString + data);
                    break;
                case 'Off':
                    this.off();
                    this.addMessage('Peer', cueString + data);
                    break;
                case 'Reset':
                    this.reset();
                    this.addMessage('Peer', cueString + data);
                    break;
                default:
                    this.addMessage('Peer', data);
                    break;
            };
        },
        sendData(msg) {
            if (this.connection.conn && this.connection.conn.open) {
                this.connection.conn.send(msg);
                // console.log("Sent: " + msg);
                this.addMessage('self', msg);
            } else {
                console.log('Connection is closed');
                this.addMessage('self', 'Connection is closed', 'danger');
            }
        },
        connOpen(id) {
            let self = this;
            if (self.connection.peer.id === null) {
                console.log('Received null id from peer open');
                self.connection.peer.id = self.connection.lastPeerId;
            } else {
                self.connection.lastPeerId = self.connection.peer.id;
            }
            console.log('ID: ' + self.connection.peer.id);
            self.connection.recvId = self.connection.peer.id;
            self.connection.status = "awaiting";
        },
        connUniqueLimit(c) {
            if (this.connection.conn && this.connection.conn.open) {
                c.on('open', function() {
                    c.send("client:busy");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }
            this.connection.conn = c;
            // console.log("Connected to: " + this.connection.conn.peer);
            this.connection.peerId = this.connection.conn.peer;
            this.addMessage('system', 'Connected to: '+this.connection.peerId, 'info');
            this.connection.status = "connected";
            this.ready();
        },
        connClose() {
            this.addMessage('system', 'Connection reset\n Awaiting connection...', 'danger');
            this.connection.status = "reset-awaiting";
            this.connection.conn = null;
            this.connection.peerId = '';
        },
        connDisconnected() {
            this.connection.status = "lost";
            // console.log('Connection lost. Please reconnect');
            this.addMessage('system', 'Connection lost. Please reconnect', 'danger');
            // Solución alternativa para peer.reconnect eliminando la identificación anterior
            this.connection.peer.id = this.connection.lastPeerId;
            this.connection.peer._lastServerId = this.connection.lastPeerId;
            this.connection.peer.reconnect();
        },
        connDestroyed() {
            this.connection.conn = null;
            this.connection.status = "destroyed";
            this.connection.peerId = '';
            // console.log('Connection destroyed');
            this.addMessage('system', 'Connection destroyed', 'danger');
        },
        connError(err) {
            console.log(err);
            // alert('' + err);
            this.addMessage('system', err, 'danger');
        },
        keypressSendMessage(e) {
            var event = e || window.event;
            var char = event.which || event.keyCode;
            if (char == '13') this.sendMessageInput();
        },
        sendMessageInput() {
            if (this.connection.conn && this.connection.conn.open) {
                var msg = this.connection.message;
                this.connection.message = "";
                this.sendData(msg)
            } else {
                console.log('Connection is closed');
                this.addMessage('self', 'Connection is closed', 'danger');
            }
        },
        ready() {
            // this.connection.conn.serialization = 'json'
            this.connection.conn.on('data', this.inputData);
            this.connection.conn.on('close', this.connClose);
            this.sendData('<CONNECTED>')
        },
        addMessage(origin, msg, type) {
            // console.log('addMessage');
            let now = new Date();
            let data = {
                type: type || (origin == 'self' ? 'primary' : (origin == 'system' ? 'dark' : 'secondary')),
                origin: origin,
                timestap: now.getTime(),
                time: {
                    h: now.getHours(),
                    m: this.addZero(now.getMinutes()),
                    s: this.addZero(now.getSeconds()),
                    ms: now.getMilliseconds()
                },
                message: msg
            };
            if (data.time.h > 12) data.time.h -= 12;
            else if (data.time.h === 0) data.time.h = 12;
            // console.log(data);
            this.connection.messages.unshift(data);
            // this.connection.messages.push(data);
            // message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
        },
        clearMessages() {
            this.connection.messages = [];
            this.addMessage('self', "Msgs cleared", 'info');
        },
        go() {
            document.getElementById("standby").className = "display-box hidden";
            document.getElementById("go").className = "display-box go";
            document.getElementById("fade").className = "display-box hidden";
            document.getElementById("off").className = "display-box hidden";
            return;
        },
        fade() {
            document.getElementById("standby").className = "display-box hidden";
            document.getElementById("go").className = "display-box hidden";
            document.getElementById("fade").className = "display-box fade";
            document.getElementById("off").className = "display-box hidden";
            return;
        },
        off() {
            document.getElementById("standby").className = "display-box hidden";
            document.getElementById("go").className = "display-box hidden";
            document.getElementById("fade").className = "display-box hidden";
            document.getElementById("off").className = "display-box off";
            return;
        },
        reset() {
            document.getElementById("standby").className = "display-box standby";
            document.getElementById("go").className = "display-box hidden";
            document.getElementById("fade").className = "display-box hidden";
            document.getElementById("off").className = "display-box hidden";
            return;
        },

        /* Functions SerialPort */
        async initTerminal() {
            let self = this;
            
            // RUN
            this.FG.term.loadAddon(this.FG.fitAddon);

            this.FG.term.onData((data) => {
                if (this.FG.echoCheckbox.checked) { this.FG.term.write(data); }
                if (this.FG.port?.writable == null) {
                    console.warn(`no se puede encontrar el puerto de escritura`);
                    return;
                }
                const writer = this.FG.port.writable.getWriter();
                if (this.FG.flushOnEnterCheckbox.checked) {
                    this.FG.toFlush += data;
                    if (data === '\r') {
                        writer.write(this.FG.encoder.encode(this.FG.toFlush));
                        writer.releaseLock();
                        this.FG.toFlush = '';
                    }
                } else {
                    writer.write(this.FG.encoder.encode(data));
                }
                writer.releaseLock();
            });


            // Mounted
            this.FG.terminalElement = document.getElementById('terminal');
            if (this.FG.terminalElement) {
                this.FG.term.open(this.FG.terminalElement);
                this.FG.fitAddon.fit();
            }

            const download = document.getElementById('download') as HTMLSelectElement;
            download.addEventListener('click', self.downloadTerminalContents);
            this.FG.portSelector = document.getElementById('ports') as HTMLSelectElement;

            this.FG.connectButton = document.getElementById('connect') as HTMLButtonElement;
            this.FG.connectButton.addEventListener('click', self.connSerial);

            this.FG.baudRateSelector = document.getElementById('baudrate') as HTMLSelectElement;
            this.FG.baudRateSelector.addEventListener('input', () => {
                if (this.FG.baudRateSelector.value == 'custom') {
                    this.FG.customBaudRateInput.hidden = false;
                } else {
                    this.FG.customBaudRateInput.hidden = true;
                }
            });

            this.FG.customBaudRateInput = document.getElementById('custom_baudrate') as HTMLInputElement;
            this.FG.dataBitsSelector = document.getElementById('databits') as HTMLSelectElement;
            this.FG.paritySelector = document.getElementById('parity') as HTMLSelectElement;
            this.FG.stopBitsSelector = document.getElementById('stopbits') as HTMLSelectElement;
            this.FG.flowControlCheckbox = document.getElementById('rtscts') as HTMLInputElement;
            this.FG.echoCheckbox = document.getElementById('echo') as HTMLInputElement;
            this.FG.flushOnEnterCheckbox = document.getElementById('enter_flush') as HTMLInputElement;
            this.FG.autoconnectCheckbox = document.getElementById('autoconnect') as HTMLInputElement;

            const convertEolCheckbox = document.getElementById('convert_eol') as HTMLInputElement;
            const convertEolCheckboxHandler = () => {
                this.FG.term.setOption('convertEol', convertEolCheckbox.checked);
            };
            convertEolCheckbox.addEventListener('change', convertEolCheckboxHandler);
            convertEolCheckboxHandler();

            const serial = this.FG.usePolyfill ? polyfill : navigator.serial;
            
            self.FG.ports = await serial.getPorts() || [];
            self.FG.ports.forEach((port) => this.addNewPort(port));

            // These events are not supported by the polyfill.
            // https://github.com/google/web-serial-polyfill/issues/20
            if (!self.FG.usePolyfill) {
                navigator.serial.addEventListener('connect', (event) => {
                    const portOption = self.addNewPort(event.target as SerialPort);
                    if (self.FG.autoconnectCheckbox.checked) {
                        portOption.selected = true;
                        self.connectToPort();
                    }
                });
                navigator.serial.addEventListener('disconnect', (event) => {
                    const portOption = self.findPortOption(event.target as SerialPort);
                    if (portOption) {
                        portOption.remove();
                    }
                });
            }
        },
        connSerial(){
            if (this.FG.port) this.disconnectFromPort();
            else this.connectToPort();
        },
        Filters(CANBUSMessage) {
            if (CANBUSMessage.indexOf('ERROR') === -1) {
                this.CANCounterGUI++;
                if (CANBUSMessage.slice(4, 5) !== "2") {
                    this.CANMessageGUI = CANBUSMessage;
                }
                if (this.info.a.test(CANBUSMessage)) {
                    this.pauseIP = false;
                    this.CANActionGUI = this.dinf.k;
                    if (this.info.k.test(CANBUSMessage)) {
                    this.recallLastFlashBlock = false;
                    this.pauseFlashBlockArray = true;
                    this.arrayLastFlashBlock = [];
                    }
                    if (this.info.e.test(CANBUSMessage) && (this.pauseFlashBlockArray === true)) {
                    this.pauseIPinstant = false;
                    this.pauseIP = true;
                    this.skippauseIPinstant = true;
                    this.CANActionGUI = this.dinf.l
                    }
                    if (this.info.t.test(CANBUSMessage)) {
                        this.changeVoltageGUI(CANBUSMessage);
                        setTimeout(() => {
                            if (this.voltageNoResponse === true) {
                            this.batteryVoltageGUI = '0.0';
                            this.checkVoltageTooLow(this.batteryVoltageGUI)
                            }
                        }, 500);
                    }
                    if (this.info.j.test(CANBUSMessage)) {
                    this.recallLastFlashBlock = true;
                    this.CANActionGUI = this.dinf.m
                    this.pauseFlashBlockArray = false;
                    }
                    if ((this.recallLastFlashBlock === true) && this.info.l.test(CANBUSMessage)) {
                    this.pauseFlashBlockArray = false;
                    }
                    if ((this.info.m.test(CANBUSMessage) === true)) {
                    if (this.info.o !== 255) {
                        this.info.o = this.info.o + 1;
                    } else {
                        this.info.o = 0
                    }
                    this.convertFlashBlockCounter()
                    }
                    if ((this.info.n.test(CANBUSMessage) === true)) {
                    this.info.o = 1;
                    this.convertFlashBlockCounter()
                    }
                    if ((this.info.y.test(CANBUSMessage))) {
                    this.CANActionGUI = this.dinf.n;
                    } else {
                        // this.emitToSocket(CANBUSMessage);
                        return CANBUSMessage;
                    }
                }
            } else {
                console.log("Error Filter-CANB", CANBUSMessage);
            }
        },
        async connectToPort(): Promise<void> {
            let self = this;
            let bufferSize = self.FG.bufferSize
            await this.getSelectedPort();
            if (!self.FG.port) return;

            const options = {
                baudRate: self.getSelectedBaudRate(),
                dataBits: Number.parseInt(self.FG.dataBitsSelector.value),
                parity: self.FG.paritySelector.value as ParityType,
                stopBits: Number.parseInt(self.FG.stopBitsSelector.value),
                flowControl: self.FG.flowControlCheckbox.checked ? <const> 'hardware' : <const> 'none',
                // bufferSize,

                // Prior to Chrome 86 these names were used.
                baudrate: self.getSelectedBaudRate(),
                databits: Number.parseInt(self.FG.dataBitsSelector.value),
                stopbits: Number.parseInt(self.FG.stopBitsSelector.value),
                rtscts: self.FG.flowControlCheckbox.checked,
            };
            console.log(options);

            self.FG.portSelector.disabled = true;
            self.FG.connectButton.textContent = 'Connecting...';
            self.FG.connectButton.disabled = true;
            self.FG.baudRateSelector.disabled = true;
            self.FG.customBaudRateInput.disabled = true;
            self.FG.dataBitsSelector.disabled = true;
            self.FG.paritySelector.disabled = true;
            self.FG.stopBitsSelector.disabled = true;
            self.FG.flowControlCheckbox.disabled = true;

            try {
                await self.FG.port.open(options);
                self.FG.term.writeln('<CONNECTED>');
                self.FG.connectButton.textContent = 'Disconnect';
                self.FG.connectButton.disabled = false;
            } catch (e) {
                console.error(e);
                self.FG.term.writeln(`<ERROR: ${e.message}>`);
                    self.markDisconnected();
                return;
            }

            // self.FG.reader = self.FG.port.readable
            // .pipeThrough(new TextDecoderStream())
            // .pipeThrough(new TransformStream(new LineBreakTransformer()))
            // .getReader();

            while (self.FG.port && self.FG.port.readable) {
                try {
                    try {
                        console.log('Usando option 1')
                        // self.FG.reader = self.FG.port.readable.getReader({mode: 'byob'});
                        self.FG.reader = self.FG.port.readable
                        .pipeThrough(new TextDecoderStream())
                        .pipeThrough(new TransformStream(new LineBreakTransformer()))
                        .getReader();
                    }
                    catch {
                        console.log('Usando option 2')
                        let decoder = new TextDecoderStream();
                        const inputDone = self.FG.port.readable.pipeTo(decoder.writable);
                        const inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
                        self.FG.reader = inputStream.getReader();
                    }

                    for (;;) {
                        const { value, done } = await self.FG.reader.read();
                        if (value) {
                            // console.log('value', value)
                            let value2 = self.Filters(value);
                            console.log('value2', value2)
                            if(value2){
                                await new Promise<void>((resolve) => {
                                    self.FG.term.write(value2+":", resolve);
                                });
                            }
                            // Send Auto
                            // this.sendData(value);
                        }

                        if (done) {
                            // |reader| has been canceled.
                            break;
                        }
                        // Do something with |value|...
                    }


                    /*
                    try {
                        self.FG.reader = self.FG.port.readable.getReader({mode: 'byob'});
                    } 
                    catch {
                        self.FG.reader = self.FG.port.readable.getReader();
                    }

                    let buffer = null;
                    for (;;) {
                        const {value, done} = await (async () => {
                            if (self.FG.reader instanceof ReadableStreamBYOBReader) {
                                if (!self.FG.buffer) {
                                    self.FG.buffer = new ArrayBuffer(bufferSize);
                                }
                                const {value, done} = await self.FG.reader.read(new Uint8Array(buffer, 0, bufferSize));
                                buffer = value?.buffer;
                                return {value, done};
                            } else {
                                return await self.FG.reader.read();
                            }
                        })();

                        if (value) {
                            await new Promise<void>((resolve) => {
                                self.FG.term.write(value, resolve);
                            });
                            // Send Auto
                            self.autoSendPeer(value);
                        }
                        if (done) {
                            break;
                        }
                    }
                    */
                } catch (e) {
                    console.error(e);
                    await new Promise<void>((resolve) => {
                        self.FG.term.writeln(`<ERROR: ${e.message}>`, resolve);
                    });
                } finally {
                    if (self.FG.reader) {
                        self.FG.reader.releaseLock();
                        self.FG.reader = undefined;
                    }
                }
            }

            if (self.FG.port) {
                try {
                    await self.FG.port.close();
                } catch (e) {
                    console.error(e);
                    self.FG.term.writeln(`<ERROR: ${e.message}>`);
                }
                this.markDisconnected();
            }
        },
        async readWithTimeout(port, timeout) {
            const reader = port.readable.getReader();
            const timer = setTimeout(() => {
                reader.releaseLock();
            }, timeout);
            const result = await reader.read();
            clearTimeout(timer);
            reader.releaseLock();
            return result;
        },
        async getSelectedPort(): Promise<void> {
            let self = this;
            if (self.FG.portSelector.value == 'prompt') {
                try {
                    const serial = self.FG.usePolyfill ? polyfill : navigator.serial;
                    self.FG.port = await serial.requestPort({});
                } catch (e) {
                    return;
                }
                const portOption = self.maybeAddNewPort(self.FG.port);
                portOption.selected = true;
            } else {
                const selectedOption = self.FG.portSelector.selectedOptions[0] as PortOption;
                self.FG.port = selectedOption.port;
            }
        },
        findPortOption(port: SerialPort | SerialPortPolyfill):PortOption | null {
            for (let i = 0; i < this.FG.portSelector.options.length; ++i) {
                const option = this.FG.portSelector.options[i];
                if (option.value === 'prompt') continue;
                const portOption = option as PortOption;
                if (portOption.port === port) return portOption;
            }
            return null;
        },
        addNewPort(port: SerialPort | SerialPortPolyfill): PortOption {
            console.log('port', port)
            
            const { comName, usbProductId, usbVendorId } = port.getInfo();
            console.log(comName, usbProductId, usbVendorId)

            const portOption = document.createElement('option') as PortOption;
            portOption.textContent = `Port ${this.FG.portCounter++}`;
            portOption.port = port;
            this.FG.portSelector.appendChild(portOption);
            return portOption;
        },
        maybeAddNewPort(port: SerialPort | SerialPortPolyfill): PortOption {
            const portOption = this.findPortOption(port);
            if (portOption) {
                return portOption;
            }
            return this.addNewPort(port);
        },
        downloadTerminalContents(): void {
            if (!this.FG.term) {
                throw new Error('no terminal instance found');
            }

            if (this.FG.term.rows === 0) {
                console.log('No output yet');
                return;
            }

            this.FG.term.selectAll();
            const contents = this.FG.term.getSelection();
            this.FG.term.clearSelection();
            const linkContent = URL.createObjectURL(
                new Blob([new TextEncoder().encode(contents).buffer],
                    {type: 'text/plain'}));
            const fauxLink = document.createElement('a');
            fauxLink.download = `terminal_content_${new Date().getTime()}.txt`;
            fauxLink.href = linkContent;
            fauxLink.click();
        },
        getSelectedBaudRate(): number {
            if (this.FG.baudRateSelector.value == 'custom') {
                return Number.parseInt(this.FG.customBaudRateInput.value);
            }
            return Number.parseInt(this.FG.baudRateSelector.value);
        },
        markDisconnected(): void {
            this.FG.term.writeln('<DISCONNECTED>');
            this.FG.portSelector.disabled = false;
            this.FG.connectButton.textContent = 'Connect';
            this.FG.connectButton.disabled = false;
            this.FG.baudRateSelector.disabled = false;
            this.FG.customBaudRateInput.disabled = false;
            this.FG.dataBitsSelector.disabled = false;
            this.FG.paritySelector.disabled = false;
            this.FG.stopBitsSelector.disabled = false;
            this.FG.flowControlCheckbox.disabled = false;
            this.FG.port = undefined;
        },
        async disconnectFromPort(): Promise<void> {
            const localPort = this.FG.port;
            this.FG.port = undefined;

            if (this.FG.reader) {
                await this.FG.reader.cancel();
            }

            if (localPort) {
                try {
                    await localPort.close();
                } catch (e) {
                    console.error(e);
                    this.FG.term.writeln(`<ERROR: ${e.message}>`);
                }
            }
            this.markDisconnected();
        },

        /* Functions SW */
        initSW(): void {
            if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                const registration = await navigator.serviceWorker.register(
                    'service-worker.js', {scope: '.'});
                console.log('SW registered: ', registration);
                } catch (registrationError) {
                console.log('SW registration failed: ', registrationError);
                }
            });
            }
        }
    }
}