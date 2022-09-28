<template>
  <main>
    <div class="container-fluid bg-danger p-1"> <!--// v-if="peerConnected == false" -->
        <div class="row bg-info p-1">
            <div class="col-md-1 bg-dark">
                <span :class="'badge rounded-pill text-bg-'+classStatus">{{connection.status}}</span>
            </div>
            <div class="col-md-2 bg-warning">
                1 Step: Conectarse al Peer 
            </div>
            <div class="col-md-3 bg-secondary">
                <abbr title="ID remote connection">ID:</abbr>&nbsp;{{connection.recvId}}
            </div>
            <div class="col-md-4 bg-info">
                <input :disabled="peerConnected == false" v-on:keypress="keypressSendMessage" class="col-md-12" type="text" v-model="connection.message" placeholder="Enter a message..." autofocus="true" />
            </div>
            <div class="col-md-2 bg-info d-grid gap-2 d-md-flex mx-auto">
                <button type="button" class="btn btn-sm btn-success" @click="sendMessageInput">Send</button>
                <button type="button" class="btn btn-sm btn-danger" @click="clearMessages">Clear Msgs (Local)</button>

            </div>
            <div class="col-md-12 bg-danger">
                peerId: {{connection.peerId}}
            </div>
            <div class="col-md-12 bg-info">
                <div id="messages">
                    <div v-for="(msg, a) in connection.messages" :class="'alert alert-'+msg.type" role="alert" v-bind:key="'msg-'+a">
                        <a class="alert-link">{{msg.origin}}</a>&nbsp;
                        <mark>{{msg.time.h}}:{{msg.time.m}}:{{msg.time.s}}</mark>&nbsp;
                        {{msg.message}}
                    </div>
                </div>
            </div>
            <div class="col-md-12 bg-dark">
                <table class="table table bordered">
                    <tr>
                        <td class="display-box standby" id="standby"><h2>Standby</h2></td>
                        <td class="display-box hidden" id="go"><h2>Go</h2></td>
                    </tr>
                    <tr>
                        <td class="display-box hidden" id="fade"><h2>Fade</h2></td>
                        <td class="display-box hidden" id="off"><h2>All Off</h2></td>
                    </tr>
                </table>
            </div>
        </div>
        <br />
    </div>
    
    <div class="container-fluid bg-dark">
        <div class="row bg-primary p-1">
            <div class="col-md-12 bg-info row">
                <div class="col-md-3 bg-success">
                    <label class="form-label" for="ports">Port:</label>
                    <select id="ports" class="form-select">
                        <option value="prompt">Add a port...</option>
                    </select>
                </div>
                <div class="col-md-3 bg-danger">
                    <label class="form-label" for="baudrate">Baud rate:</label>
                    <select id="baudrate" class="form-select">
                        <option value="9600">9600</option>
                        <option value="14400">14400</option>
                        <option value="19200">19220</option>
                        <option value="28800">28800</option>
                        <option value="38400">38400</option>
                        <option value="57600">57600</option>
                        <option value="115200" selected>115200</option>
                        <option value="230400">230400</option>
                        <option value="460800">460800</option>
                        <option value="921600">921600</option>
                        <option value="custom">Custom</option>
                    </select>
                    <input id="custom_baudrate" class="form-control" type="number" min="1" placeholder="Enter baudrate..." hidden />
                </div>
                <div class="col-md-2 bg-secondary">
                    <label class="form-label" for="databits">Data bits:</label>
                    <select id="databits" class="form-select">
                        <option value="7">7</option>
                        <option value="8" selected>8</option>
                    </select>
                </div>
                <div class="col-md-2 bg-warning">
                    <label class="form-label" for="parity">Parity:</label>
                    <select id="parity" class="form-select">
                        <option value="none" selected>None</option>
                        <option value="even">Even</option>
                        <option value="odd">Odd</option>
                    </select>
                </div>
                <div class="col-md-2 bg-secondary">
                    <label class="form-label" for="stopbits">Stop bits:</label>
                    <select id="stopbits" class="form-select">
                        <option value="1" selected>1</option>
                        <option value="2">2</option>
                    </select>
                </div>
                <div class="col-md-12 bg-warning align-self-end text-end">
                    <button id="connect" class="btn btn-lg btn-primary" :disabled="peerConnected == false">Connect</button>
                </div>
            </div>
            <div class="col-md-12 bg-info row">
                <div class="col-md-2 bg-success">
                    <input id="rtscts" type="checkbox" class="form-check-input">
                    <label class="form-check-label" for="rtscts">Hardware flow control</label>
                </div>
                <div class="col-md-2 bg-danger">
                    <input id="echo" type="checkbox" class="form-check-input">
                    <label for="echo">Local echo</label>
                </div>
                <div class="col-md-2 bg-warning">
                    <input id="enter_flush" type="checkbox" class="form-check-input">
                    <label class="form-check-label" for="enter_flush">Flush on enter</label>
                </div>
                <div class="col-md-2 bg-success">
                    <input id="convert_eol" type="checkbox" class="form-check-input">
                    <label class="form-check-label" for="convert_eol">Convert EOL</label>
                </div>
                <div class="col-md-2 bg-danger">
                    <input id="autoconnect" type="checkbox" class="form-check-input">
                    <label class="form-check-label" for="autoconnect">Automatically connect</label>
                </div>
                <div class="col-md-2 bg-warning">
                    <button id="download" class="btn btn-secondary">Download output</button>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12 bg-info">
                <div id="terminal"></div>
            </div>
        </div>
    </div>
  </main>
</template>

<script lang="ts">
import { Peer } from "peerjs";
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {
serial as polyfill, SerialPort as SerialPortPolyfill,
} from 'web-serial-polyfill';

declare class PortOption extends HTMLOptionElement {
    port: SerialPort | SerialPortPolyfill;
}

const utils = {
    methods: {
        addZero(t) {
            if (t < 10)
                t = "0" + t;
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
        };
    },
    computed: {
        peerConnected() {
            try {
                return (this.connection.conn && this.connection.status == 'connected' && this.connection.peerId.length>10) ? true : false;
            } catch(e) {
                console.log(e)
            }
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
        },
        addMessage(origin, msg, type) {
            console.log('addMessage');
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
            console.log(data);
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
        autoSendPeer(msg) {
            console.log('autoSendPeer', typeof(msg), this.isAbv(msg));
            let isArrayBuffer = this.isAbv(msg) || false;
            if(this.isAbv(msg)){
                if (!("TextDecoder" in window)) {
                    alert("Sorry, this browser does not support TextDecoder...");
                    return;
                }

                let dec = new TextDecoder(); // always utf-8
                let stringDec = dec.decode(msg);
                console.log(stringDec);
                this.sendData(stringDec);
            } else {
                this.sendData(msg);
            }
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
                bufferSize,

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

            while (self.FG.port && self.FG.port.readable) {
                try {
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
</script>

<style scoped>
#terminal {
    height: 25vh;
    background-color: black;
}
#messages {
    height: 25vh;
    background-color: rgb(100, 100, 100);
    overflow-y: auto;
}



.display {
    width: 100%;
    min-height: 400px;
    padding-bottom: 20px;
}

.control {
    width: 100%;
    padding-bottom: 20px;
}

.control-button {
    width: 100%;
    min-height: 50px;
}

.display-box {
    border: 2px solid black;
}

.standby {
    background-color: red;
}

.go {
    background-color: green;
}

.fade {
    background-color: yellow;
}

.off {
    background-color: gray;
}

.hidden {
    visibility: hidden;
}

.no-display {
    display: none;
}

.msg-time {
    color: blue;
}

.cueMsg {
    color: orange;
}

.selfMsg {
    color: green;
}

.peerMsg {
    color: red;
}
</style>