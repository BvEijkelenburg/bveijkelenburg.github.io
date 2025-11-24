function composePythonAutoFlushUserCode(userCode) {
    /* AutoFlush is used to ensure that print output always appears in the console.
       Otherwise, a statement like print("x", end="") would produce no visible output.
       The exec/compile construct ensures that errors in student code are printed
       with the correct line numbers. By executing the code separately, it creates
       a new call on the stack, and the student code starts again at line 1. */

    return `
        import sys
        
        class AutoFlushWriter:
            def __init__(self, stream):
                self.stream = stream
            def write(self, data):
                self.stream.write(data)
                self.stream.flush()
            def flush(self):
                self.stream.flush()
        
        sys.stdout = AutoFlushWriter(sys.stdout)
        sys.stderr = AutoFlushWriter(sys.stderr)
        
        exec(compile(${JSON.stringify(userCode)}, "<user_code>", "exec"))
    `;
}

function runPython() {
    // Removing and stopping current running programs (if any)
    document.getElementById('pyterminal-container').innerHTML = "";

    stopRunningPrograms()

    // Creating a new PyScript tag
    const progress = document.getElementById("progress-container");
    const userCode = window.editor.getValue();
    const script = document.createElement("script");
    const userCodeWithAutoFlush = composePythonAutoFlushUserCode(userCode);

    script.type = "py";
    script.setAttribute("id", "myterminal");
    script.setAttribute("terminal", "");
    script.setAttribute("worker", "");
    script.textContent = userCodeWithAutoFlush;

    script.addEventListener("py:done", () => {
        console.log("PyScript klaar met uitvoeren!");
        progress.style.visibility = "hidden";
    });

    document.getElementById("pyterminal-container").appendChild(script);
    progress.style.visibility = "visible";
}

async function copyCodeToClipboard() {
    await navigator.clipboard.writeText(window.editor.getValue());

    const copiedIcon = document.getElementById('copied');
    copiedIcon.classList.add('show');
    setTimeout(() => copiedIcon.classList.remove('show'), 1000);
}

function showTimeInBrowser() { // Get current date and time
    var now = new Date();
    document.getElementById("datetime").innerHTML = now.toLocaleTimeString("nl-NL");
    window.setTimeout(showTimeInBrowser, 1)
}

function stopRunningPrograms() {
    for (let key of Object.keys(workers)) {
        console.log(`Stopping webworker ${key}!`)

        workers[key].terminate()
        delete workers[key];
    }

    document.getElementById("progress-container").style.visibility = "hidden";
}

function createCodeMirrorEditor() {
    return CodeMirror(document.getElementById("editor-container"), {
        mode: "python",
        theme: "monokai",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        smartIndent: true,
        extraKeys: {
            Tab: function (cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    const spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            }
        }
    });
}


function main() {
    // Workers are logged in order to be able to terminate a (Py)script.
    const originalWorker = window.Worker;
    window.workers = {};

    // Overriding original Worker-constructor
    window.Worker = function (...args) {
        const worker = new originalWorker(...args);
        workers[args[0]] = worker

        console.log("Worker created:", args[0]);
        return worker;
    };
    // End of worker-logging

    window.addEventListener("py:all-done", e => {
        showTimeInBrowser()

        window.editor = createCodeMirrorEditor()
        window.editor.setValue('print("Hello world!")')
        window.editor.on("change", function (cm, changeObj) {
            if (changeObj.origin === "paste") {
                const tabSize = cm.getOption("indentUnit");
                const spaces = " ".repeat(tabSize);
                const content = cm.getValue().replace(/\t/g, spaces);
                const cursor = cm.getCursor();

                cm.setValue(content);
                cm.setCursor(cursor); // behoud cursorpositie
            }
        });

        document.getElementById("runner").addEventListener("click", runPython);
        document.getElementById("copy").addEventListener("click", copyCodeToClipboard)
        document.getElementById("stop-button").addEventListener("click", stopRunningPrograms)
    });
}

main()

