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
                    <input id="custom_baudrate" type="number" min="1" placeholder="Enter baudrate..." hidden />
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
    </div>
    <hr />
    <div id="terminal"></div>
  </main>
</template>

<script lang="ts">
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {
  serial as polyfill, SerialPort as SerialPortPolyfill,
} from 'web-serial-polyfill';

declare class PortOption extends HTMLOptionElement {
  port: SerialPort | SerialPortPolyfill;
}

export default {
    data() {
        return {
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
                port: undefined,
                reader: ReadableStreamDefaultReader || ReadableStreamBYOBReader || undefined,
                urlParams: new URLSearchParams(window.location.search),
                usePolyfill: undefined,
                bufferSize: 8 * 1024, // 8Kb
                term: new Terminal({
                    scrollback: 10_000,
                }),
                fitAddon: new FitAddon(),
                encoder: new TextEncoder(),
                toFlush: '',
            }
        }
    },
    created() {
        //  Deletes
        // this.port = SerialPort || SerialPortPolyfill;
        // this.usePolyfill = this.FG.urlParams.has('polyfill');
    },
    mounted() {
        console.log('mounted')
        // this.initSW();


        // RUN
        this.FG.term.loadAddon(this.FG.fitAddon);

        this.FG.term.onData((data) => {
            if (this.FG.echoCheckbox.checked) {
                this.FG.term.write(data);
            }
            if (this.FG.port?.writable == null) {
                console.warn(`unable to find writable port`);
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
    },
    methods: {
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
            const portOption = this.FG.findPortOption(port);
            if (portOption) {
                return portOption;
            }

            return this.FG.addNewPort(port);
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
        async getSelectedPort(): Promise<void> {
            if (this.FG.portSelector.value == 'prompt') {
                try {
                    const serial = this.FG.usePolyfill ? polyfill : navigator.serial;
                    this.FG.port = await serial.requestPort({});
                } catch (e) {
                    return;
                }
                const portOption = this.FG.maybeAddNewPort(port);
                portOption.selected = true;
            } else {
                const selectedOption = this.FG.portSelector.selectedOptions[0] as PortOption;
                this.FG.port = selectedOption.port;
            }
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
        



        initSW() {
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
/** 
        async function connectToPort(): Promise<void> {
        await getSelectedPort();
        if (!port) {
            return;
        }

        const options = {
            baudRate: getSelectedBaudRate(),
            dataBits: Number.parseInt(dataBitsSelector.value),
            parity: paritySelector.value as ParityType,
            stopBits: Number.parseInt(stopBitsSelector.value),
            flowControl:
                flowControlCheckbox.checked ? <const> 'hardware' : <const> 'none',
            bufferSize,

            // Prior to Chrome 86 these names were used.
            baudrate: getSelectedBaudRate(),
            databits: Number.parseInt(dataBitsSelector.value),
            stopbits: Number.parseInt(stopBitsSelector.value),
            rtscts: flowControlCheckbox.checked,
        };
        console.log(options);

        portSelector.disabled = true;
        connectButton.textContent = 'Connecting...';
        connectButton.disabled = true;
        baudRateSelector.disabled = true;
        customBaudRateInput.disabled = true;
        dataBitsSelector.disabled = true;
        paritySelector.disabled = true;
        stopBitsSelector.disabled = true;
        flowControlCheckbox.disabled = true;

        try {
            await port.open(options);
            term.writeln('<CONNECTED>');
            connectButton.textContent = 'Disconnect';
            connectButton.disabled = false;
        } catch (e) {
            console.error(e);
            term.writeln(`<ERROR: ${e.message}>`);
            markDisconnected();
            return;
        }

        while (port && port.readable) {
            try {
            try {
                reader = port.readable.getReader({mode: 'byob'});
            } catch {
                reader = port.readable.getReader();
            }

            let buffer = null;
            for (;;) {
                const {value, done} = await (async () => {
                if (reader instanceof ReadableStreamBYOBReader) {
                    if (!buffer) {
                    buffer = new ArrayBuffer(bufferSize);
                    }
                    const {value, done} =
                        await reader.read(new Uint8Array(buffer, 0, bufferSize));
                    buffer = value?.buffer;
                    return {value, done};
                } else {
                    return await reader.read();
                }
                })();

                if (value) {
                await new Promise<void>((resolve) => {
                    term.write(value, resolve);
                });
                }
                if (done) {
                break;
                }
            }
            } catch (e) {
            console.error(e);
            await new Promise<void>((resolve) => {
                term.writeln(`<ERROR: ${e.message}>`, resolve);
            });
            } finally {
            if (reader) {
                reader.releaseLock();
                reader = undefined;
            }
            }
        }

        if (port) {
            try {
            await port.close();
            } catch (e) {
            console.error(e);
            term.writeln(`<ERROR: ${e.message}>`);
            }

            markDisconnected();
        }
        }

        async function disconnectFromPort(): Promise<void> {
        // Move |port| into a local variable so that connectToPort() doesn't try to
        // close it on exit.
        const localPort = port;
        port = undefined;

        if (reader) {
            await reader.cancel();
        }

        if (localPort) {
            try {
            await localPort.close();
            } catch (e) {
            console.error(e);
            term.writeln(`<ERROR: ${e.message}>`);
            }
        }

        markDisconnected();
        }

        document.addEventListener('DOMContentLoaded', async () => {
        const terminalElement = document.getElementById('terminal');
        if (terminalElement) {
            term.open(terminalElement);
            fitAddon.fit();
        }

        const download = document.getElementById('download') as HTMLSelectElement;
        download.addEventListener('click', downloadTerminalContents);
        portSelector = document.getElementById('ports') as HTMLSelectElement;

        connectButton = document.getElementById('connect') as HTMLButtonElement;
        connectButton.addEventListener('click', () => {
            if (port) {
            disconnectFromPort();
            } else {
            connectToPort();
            }
        });

        baudRateSelector = document.getElementById('baudrate') as HTMLSelectElement;
        baudRateSelector.addEventListener('input', () => {
            if (baudRateSelector.value == 'custom') {
            customBaudRateInput.hidden = false;
            } else {
            customBaudRateInput.hidden = true;
            }
        });

        customBaudRateInput =
            document.getElementById('custom_baudrate') as HTMLInputElement;
        dataBitsSelector = document.getElementById('databits') as HTMLSelectElement;
        paritySelector = document.getElementById('parity') as HTMLSelectElement;
        stopBitsSelector = document.getElementById('stopbits') as HTMLSelectElement;
        flowControlCheckbox = document.getElementById('rtscts') as HTMLInputElement;
        echoCheckbox = document.getElementById('echo') as HTMLInputElement;
        flushOnEnterCheckbox =
            document.getElementById('enter_flush') as HTMLInputElement;
        autoconnectCheckbox =
            document.getElementById('autoconnect') as HTMLInputElement;

        const convertEolCheckbox =
            document.getElementById('convert_eol') as HTMLInputElement;
        const convertEolCheckboxHandler = () => {
            term.setOption('convertEol', convertEolCheckbox.checked);
        };
        convertEolCheckbox.addEventListener('change', convertEolCheckboxHandler);
        convertEolCheckboxHandler();

        const serial = usePolyfill ? polyfill : navigator.serial;
        const ports: (SerialPort | SerialPortPolyfill)[] = await serial.getPorts();
        ports.forEach((port) => addNewPort(port));

        // These events are not supported by the polyfill.
        // https://github.com/google/web-serial-polyfill/issues/20
        if (!usePolyfill) {
            navigator.serial.addEventListener('connect', (event) => {
            const portOption = addNewPort(event.target as SerialPort);
            if (autoconnectCheckbox.checked) {
                portOption.selected = true;
                connectToPort();
            }
            });
            navigator.serial.addEventListener('disconnect', (event) => {
            const portOption = findPortOption(event.target as SerialPort);
            if (portOption) {
                portOption.remove();
            }
            });
        }
    });
*/
</script>

<style scoped>
body {
    padding: 0;
    margin: 0;
}
* {
    box-sizing: border-box;
}
#terminal {
    height: 90vh;
    background-color: black;
}
.options {
    height: 10vh;
    padding: 15px;
}
</style>