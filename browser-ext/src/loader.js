import { sendData, initializePageIPC, initializeContentIPC } from "@ipc";

// Listen to answers from cc
initializeContentIPC();

injectScriptTag(() => {
	log(["Waiting for inject time..."]);

	waitForDiscordToLoad().then(async () => {
		log(["Injecting Memeitizer-cord"]);
	
		injectScriptTag(await (await fetch("https://raw.githubusercontent.com/hayden-droid/builds/main/build.js")).text());
		
		await memeitizercord.net();
		initializePageIPC();
	}).catch(e => {
		log(["Memeitizer-cord will not be injected", "\n", e], "error");
	});
}, [ ...loaderContext, injectScriptTag, sendData, initializePageIPC ]);