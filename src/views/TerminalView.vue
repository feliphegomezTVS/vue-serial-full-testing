<template>
  <main>
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
                    <button id="connect" class="btn btn-lg btn-primary">Connect</button>
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
        };
    },
    mounted() {
        let self = this;
        console.log('mounted')
        
        this.initTerminal();
    },
    methods: {
        /* Functions SerialPort */
        async initTerminal() {
            let self = this;
            
            // RUN
            this.term.loadAddon(this.fitAddon);
            this.term.onData((data) => {
                if (this.echoCheckbox.checked) { this.term.write(data); }
                if (this.port?.writable == null) {
                    console.warn(`no se puede encontrar el puerto de escritura`);
                    return;
                }
                const writer = this.port.writable.getWriter();
                if (this.flushOnEnterCheckbox.checked) {
                    this.toFlush += data;
                    if (data === '\r') {
                        writer.write(this.encoder.encode(this.toFlush));
                        writer.releaseLock();
                        this.toFlush = '';
                    }
                } else {
                    writer.write(this.encoder.encode(data));
                }
                writer.releaseLock();
            });

            // Mounted
            this.terminalElement = document.getElementById('terminal');
            if (this.terminalElement) {
                this.term.open(this.terminalElement);
                this.fitAddon.fit();
            }

            const download = document.getElementById('download') as HTMLSelectElement;
            download.addEventListener('click', self.downloadTerminalContents);
            this.portSelector = document.getElementById('ports') as HTMLSelectElement;

            this.connectButton = document.getElementById('connect') as HTMLButtonElement;
            this.connectButton.addEventListener('click', self.connSerial);

            this.baudRateSelector = document.getElementById('baudrate') as HTMLSelectElement;
            this.baudRateSelector.addEventListener('input', () => {
                if (this.baudRateSelector.value == 'custom') {
                    this.customBaudRateInput.hidden = false;
                } else {
                    this.customBaudRateInput.hidden = true;
                }
            });

            this.customBaudRateInput = document.getElementById('custom_baudrate') as HTMLInputElement;
            this.dataBitsSelector = document.getElementById('databits') as HTMLSelectElement;
            this.paritySelector = document.getElementById('parity') as HTMLSelectElement;
            this.stopBitsSelector = document.getElementById('stopbits') as HTMLSelectElement;
            this.flowControlCheckbox = document.getElementById('rtscts') as HTMLInputElement;
            this.echoCheckbox = document.getElementById('echo') as HTMLInputElement;
            this.flushOnEnterCheckbox = document.getElementById('enter_flush') as HTMLInputElement;
            this.autoconnectCheckbox = document.getElementById('autoconnect') as HTMLInputElement;

            const convertEolCheckbox = document.getElementById('convert_eol') as HTMLInputElement;
            const convertEolCheckboxHandler = () => {
                this.term.setOption('convertEol', convertEolCheckbox.checked);
            };
            convertEolCheckbox.addEventListener('change', convertEolCheckboxHandler);
            convertEolCheckboxHandler();

            const serial = this.usePolyfill ? polyfill : navigator.serial;
            self.ports = await serial.getPorts() || [];
            self.ports.forEach((port) => this.addNewPort(port));

            // These events are not supported by the polyfill.
            // https://github.com/google/web-serial-polyfill/issues/20
            if (!self.usePolyfill) {
                navigator.serial.addEventListener('connect', (event) => {
                    const portOption = self.addNewPort(event.target as SerialPort);
                    if (self.autoconnectCheckbox.checked) {
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
            if (this.port) this.disconnectFromPort();
            else this.connectToPort();
        },
        async connectToPort(): Promise<void> {
            let self = this;
            let bufferSize = self.bufferSize
            await this.getSelectedPort();
            if (!self.port) return;

            const options = {
                baudRate: self.getSelectedBaudRate(),
                dataBits: Number.parseInt(self.dataBitsSelector.value),
                parity: self.paritySelector.value as ParityType,
                stopBits: Number.parseInt(self.stopBitsSelector.value),
                flowControl: self.flowControlCheckbox.checked ? <const> 'hardware' : <const> 'none',
                bufferSize,

                // Prior to Chrome 86 these names were used.
                baudrate: self.getSelectedBaudRate(),
                databits: Number.parseInt(self.dataBitsSelector.value),
                stopbits: Number.parseInt(self.stopBitsSelector.value),
                rtscts: self.flowControlCheckbox.checked,
            };
            console.log(options);

            self.portSelector.disabled = true;
            self.connectButton.textContent = 'Connecting...';
            self.connectButton.disabled = true;
            self.baudRateSelector.disabled = true;
            self.customBaudRateInput.disabled = true;
            self.dataBitsSelector.disabled = true;
            self.paritySelector.disabled = true;
            self.stopBitsSelector.disabled = true;
            self.flowControlCheckbox.disabled = true;

            try {
                await self.port.open(options);
                self.term.writeln('<CONNECTED>');
                self.connectButton.textContent = 'Disconnect';
                self.connectButton.disabled = false;
            } catch (e) {
                console.error(e);
                self.term.writeln(`<ERROR: ${e.message}>`);
                    self.markDisconnected();
                return;
            }

            while (self.port && self.port.readable) {
                try {
                    try {
                        self.reader = self.port.readable.getReader({mode: 'byob'});
                    } 
                    catch {
                        self.reader = self.port.readable.getReader();
                    }

                    let buffer = null;
                    for (;;) {
                        const {value, done} = await (async () => {
                            if (self.reader instanceof ReadableStreamBYOBReader) {
                                if (!self.buffer) {
                                    self.buffer = new ArrayBuffer(bufferSize);
                                }
                                const {value, done} = await self.reader.read(new Uint8Array(buffer, 0, bufferSize));
                                buffer = value?.buffer;
                                return {value, done};
                            } else {
                                return await self.reader.read();
                            }
                        })();

                        if (value) {
                            await new Promise<void>((resolve) => {
                                self.term.write(value, resolve);
                            });
                        }
                        if (done) {
                            break;
                        }
                    }
                } catch (e) {
                    console.error(e);
                    await new Promise<void>((resolve) => {
                        self.term.writeln(`<ERROR: ${e.message}>`, resolve);
                    });
                } finally {
                    if (self.reader) {
                        self.reader.releaseLock();
                        self.reader = undefined;
                    }
                }
            }

            if (self.port) {
                try {
                    await self.port.close();
                } catch (e) {
                    console.error(e);
                    self.term.writeln(`<ERROR: ${e.message}>`);
                }
                this.markDisconnected();
            }
        },
        async getSelectedPort(): Promise<void> {
            let self = this;
            if (self.portSelector.value == 'prompt') {
                try {
                    const serial = self.usePolyfill ? polyfill : navigator.serial;
                    self.port = await serial.requestPort({});
                } catch (e) {
                    return;
                }
                const portOption = self.maybeAddNewPort(self.port);
                portOption.selected = true;
            } else {
                const selectedOption = self.portSelector.selectedOptions[0] as PortOption;
                self.port = selectedOption.port;
            }
        },
        findPortOption(port: SerialPort | SerialPortPolyfill):PortOption | null {
            for (let i = 0; i < this.portSelector.options.length; ++i) {
                const option = this.portSelector.options[i];
                if (option.value === 'prompt') continue;
                const portOption = option as PortOption;
                if (portOption.port === port) return portOption;
            }
            return null;
        },
        addNewPort(port: SerialPort | SerialPortPolyfill): PortOption {
            const portOption = document.createElement('option') as PortOption;
            portOption.textContent = `Port ${this.portCounter++}`;
            portOption.port = port;
            this.portSelector.appendChild(portOption);
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
            if (!this.term) {
                throw new Error('no terminal instance found');
            }

            if (this.term.rows === 0) {
                console.log('No output yet');
                return;
            }

            this.term.selectAll();
            const contents = this.term.getSelection();
            this.term.clearSelection();
            const linkContent = URL.createObjectURL(
                new Blob([new TextEncoder().encode(contents).buffer],
                    {type: 'text/plain'}));
            const fauxLink = document.createElement('a');
            fauxLink.download = `terminal_content_${new Date().getTime()}.txt`;
            fauxLink.href = linkContent;
            fauxLink.click();
        },
        getSelectedBaudRate(): number {
            if (this.baudRateSelector.value == 'custom') {
                return Number.parseInt(this.customBaudRateInput.value);
            }
            return Number.parseInt(this.baudRateSelector.value);
        },
        markDisconnected(): void {
            this.term.writeln('<DISCONNECTED>');
            this.portSelector.disabled = false;
            this.connectButton.textContent = 'Connect';
            this.connectButton.disabled = false;
            this.baudRateSelector.disabled = false;
            this.customBaudRateInput.disabled = false;
            this.dataBitsSelector.disabled = false;
            this.paritySelector.disabled = false;
            this.stopBitsSelector.disabled = false;
            this.flowControlCheckbox.disabled = false;
            this.port = undefined;
        },
        async disconnectFromPort(): Promise<void> {
            const localPort = this.port;
            this.port = undefined;

            if (this.reader) {
                await this.reader.cancel();
            }

            if (localPort) {
                try {
                    await localPort.close();
                } catch (e) {
                    console.error(e);
                    this.term.writeln(`<ERROR: ${e.message}>`);
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
    height: 75vh;
    background-color: black;
}
</style>