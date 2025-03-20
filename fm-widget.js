// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;

// This script is used to fetch data from a FileMaker database using OData
// The data is then displayed in a widget

if (config.runsInWidget) {
	const size = config.widgetFamily;
	const widget = await createWidget(size);

	Script.setWidget(widget);
	Script.complete();
} 
else {
	// For debugging
	const size = 'small';
	//const size = 'medium'
	//const size = 'large'
	const widget = await createWidget(size);
	if (size == 'small') {
		widget.presentSmall();
	} else if (size == 'medium') {
		widget.presentMedium();
	} else {
		widget.presentLarge();
	}
	Script.complete();
}

async function createWidget(size) {

	const numColumns = (size === 'small') ? 7 : 14;
	const graphWidh = (size === 'small')? 400 : 800;
	const graphHeight = (size === 'large')? 800 : 200;
	let graphColor = 'EDEDED';

	const widget = new ListWidget();
	widget.setPadding(8, 14, 14, 14); // top, leading, bot, trailing
	widget.backgroundColor = new Color('#0091F2');

	const contentStack = widget.addStack();
	contentStack.layoutVertically();

	const primaryInfo = contentStack.addStack();
	primaryInfo.layoutHorizontally();

	const fmConnection = {
		"database": "https://SERVERNAMN/fmi/odata/v4/DATABAS/Antal",
		"account": "KONTONAMN",
		"password": "LÖSENORD"
	};
	let result = await findRecords (fmConnection, numColumns);

	let s = 'Antal';
	if (result.value.length > 0) {
		s = s + ': ' + result.value[0].antal;
	}
	let antalText = widget.addText(s);
	antalText.font = Font.boldSystemFont(28);
	antalText.textColor = new Color ('EDEDED');
	antalText.rightAlignText();
	widget.addSpacer(2);
	
	let idag = new Date();
	let idagText = idag.toISOString().substring(0,10); 

	let datumText = widget.addText(idagText);
	datumText.font = Font.regularSystemFont(12);
	datumText.textColor = new Color ('EDEDED');
	datumText.rightAlignText();
	widget.addSpacer(8);

	let image = columnGraph(result["value"], graphWidh, graphHeight, new Color(graphColor)).getImage();
	let graph = widget.addImage(image);
	graph.centerAlignImage();

	widget.addSpacer(5);

	return widget;
}

async function findRecords (fmConnection, numColumns) {

	let datumStart = new Date();
	datumStart.setDate(datumStart.getDate() - numColumns);
	let datumStartText = datumStart.toISOString().substring(0,10);

    const url = fmConnection.database + "?filter=datum%20gt%20'" + datumStartText + "'&$orderby=datum%20desc&select=antal,datum";
    const req = new Request(url);
    req.method = "GET";
    req.headers =
        {
            "Accept": "application/json",
            "OData-Version": "4.0",
            "OData-MaxVersion": "4.0",
            "Authorization": "Basic " + btoa(fmConnection.account + ":" + fmConnection.password)
        };
    const response = await req.loadJSON();

    return response;
}

function columnGraph(data, width, height, colour) {

	let max = data[0].antal; // initialize to the first value
	for (let i = 1; i < data.length; i++) {
		if (data[i].antal > max) {
			max = data[i].antal;
		}
	}

	let context = new DrawContext()
	context.size = new Size(width, height)
	context.opaque = false
	context.setFillColor(colour)
	data.forEach((value, index) => {
		let w = width / (2 * data.length - 1)
		let h = value.antal / max * height
		let x = width - (index * 2 + 1) * w
		let y = height - h
		let rect = new Rect(x, y, w, h)
		context.fillRect(rect)
	})
	return context
}
