var relevantTitlePartMatch = title.match(/^(.*?)(?:\sS\d{2}E\d{2}|\s\d{4})/i);
var relevantTitlePart = relevantTitlePartMatch[1].trim().toLowerCase().replace(/\./g, ' ').replace(/[\-:]/g, '');


//console.log("Relevant Title Part: " + relevantTitlePart);


page.loading = true;
var query = title;
var episodeIdentifier = query.match(/s\d+e\d+/gi);
var identifier;

if (!episodeIdentifier) {
	var identifier = query.match(/\d{4}/i);
}

if (query.toLowerCase().indexOf('crash canyon') !== -1) {
	modifiedQuery = 'crash-canyon-full-series';
} else if (query.toLowerCase().indexOf('king of the hill') !== -1) {
	modifiedQuery = 'king-of-the-hill13seasons';
} else if (query.toLowerCase().indexOf('trailer park boys') !== -1) {
	modifiedQuery = 'doopey poopy';
} else if (query.toLowerCase().indexOf('the simpsons') !== -1) {
	modifiedQuery = 'thesimpletons 2';
} else if (query.toLowerCase().indexOf('bad santa') !== -1) {
	modifiedQuery = 'sqjeargbrmdmkfm0pgf';
} else if (episodeIdentifier) {
	modifiedQuery = relevantTitlePart;
} else {
	modifiedQuery = query
}

//console.log("Modified Query: " + modifiedQuery);

var apiUrl = "https://archive.org/advancedsearch.php";

var args = {
	q: modifiedQuery,
	fl: ["identifier", "title", "mediatype", "subject", "format"],
	sort: "downloads desc",
	rows: 35,
	page: 1,
	output: "json"
};

try {
	var response = showtime.httpReq(apiUrl, {
		args: args
	});

	var json = JSON.parse(response.toString());

	if (json.response && json.response.docs && json.response.docs.length > 0) {
		var results = [];
		var matchedFiles = [];
		var nonMatchedFiles = [];
		var videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'];

		// Create a new cleaned query variable
		var cleanedQuery = relevantTitlePart;

		// Iterate over each document in the response
		for (var i = 0; i < json.response.docs.length; i++) {
			var doc = json.response.docs[i];

			if (doc.subject && doc.subject.indexOf('Movie Trailer') !== -1) {
				continue;
			}
			var codec = "Unknown";

			if (/[xXhH]265/i.test(doc.format)) {var codec = 'H265';};

			var itemDetailsUrl = "https://archive.org/metadata/" + doc.identifier;
			var itemResponse = showtime.httpReq(itemDetailsUrl);
			var itemJson = JSON.parse(itemResponse.toString());

			if (itemDetailsUrl.indexOf('only-fools') !== -1 && relevantTitlePart.indexOf('steptoe') !== -1) continue;
			if (itemDetailsUrl.indexOf('steptoe') !== -1 && relevantTitlePart.indexOf('only fools') !== -1) continue;


			// Check if there are files
			if (itemJson.files) {
				var foundFile = false;

				// Iterate over files to find matching episode or movie
				for (var j = 0; j < itemJson.files.length; j++) {
					var file = itemJson.files[j];


					//page.appendItem("", "separator", { title: "File Found: " + file.name });


					// Check if the file is a video file
					var isVideoFile = false;
					for (var k = 0; k < videoExtensions.length; k++) {
						if (file.name.toLowerCase().indexOf(videoExtensions[k]) !== -1) {
							isVideoFile = true;
							break;
						}
					}


					//console.log("InternetArchive | Relevant Title Part: " + relevantTitlePart);


					var titleForCheck = file.name.trim().toLowerCase().replace(/\./g, ' ').replace(/[\-:]/g, '');
					//if (titleForCheck.indexOf(relevantTitlePart) === -1) continue;
					if (titleForCheck.indexOf(relevantTitlePart) === -1 && relevantTitlePart.indexOf('steptoe and son') === -1 && relevantTitlePart.indexOf('only fools') === -1) continue;
					//page.appendItem("", "separator", { title: "Identifier: " + identifier });
					if (!episodeIdentifier && titleForCheck.indexOf(identifier) === -1) continue;


					if (query.toLowerCase().indexOf('duel') !== -1 && file.name.toLowerCase().indexOf('duel_1971.mp4') !== -1 ) {continue;}
					if (query.toLowerCase().indexOf('uncle buck') !== -1 && file.name.toLowerCase().indexOf('bbc') !== -1 ) {quality = "480p";} else {quality = 'Unknown';}
					if (query.toLowerCase().indexOf('trains and automobiles') !== -1 && file.name.toLowerCase().indexOf(".ia.mp4") === -1) {continue;}

					console.log("File Found: " + file.name);

					var excludeJail = relevantTitlePart.indexOf('trailer park boys jail') === -1 && titleForCheck.indexOf('trailer park boys jail') !== -1;
					if (excludeJail) continue;

					var excludeAnimated = relevantTitlePart.indexOf('trailer park boys the animated series') === -1 && titleForCheck.indexOf('trailer park boys the animated series') !== -1;
					if (excludeAnimated) continue;

					var excludeAnimated = relevantTitlePart.indexOf('trailer park boys out of the park') === -1 && titleForCheck.indexOf('trailer park boys out of the park') !== -1;
					if (excludeAnimated) continue;


					if (/[xXhH]265/i.test(file.name)) {var codec = 'H265';};

					if (/1080p/i.test(titleForCheck)){
						quality = "1080p";
					} else if (/720p/i.test(titleForCheck)){
						quality = "720p";
					} else if (/XviD/i.test(titleForCheck)){
						quality = "480p";
					}

					if (quality = 'Unknown' && query.toLowerCase().indexOf('trailer park boys') !== -1) {quality = "480p";}
                    if (quality = 'Unknown' && query.toLowerCase().indexOf('the osbournes') !== -1) {quality = "480p";}

					if (episodeIdentifier && file.name.toLowerCase().indexOf(episodeIdentifier[0].toLowerCase()) !== -1 && isVideoFile) {
						foundFile = true;
						var videoLink = "https://archive.org/download/" + doc.identifier + "/" + encodeURIComponent(file.name);
						matchedFiles.push({ title: file.name, item: videoLink, quality: quality, codec: codec });
					} else if (isVideoFile) {
						var queryWords = cleanedQuery.toLowerCase().split(/\s+/);

						if (queryWords.every(function(word) {
							return file.name.toLowerCase().indexOf(word) !== -1;
						})) {
							var videoLink = "https://archive.org/download/" + doc.identifier + "/" + encodeURIComponent(file.name);
							nonMatchedFiles.push({ title: file.name, item: videoLink, quality: quality, codec: codec });
						}
					}
				}
			}
		}

		// Append matched files if any
		if (matchedFiles.length > 0) {
			for (var i = 0; i < matchedFiles.length; i++) {
				var magnetLink = matchedFiles[i].item;
				var quality = matchedFiles[i].quality;
				var codec = matchedFiles[i].codec;
				var seederCount = '60'; // Dummy value - since we're not actually dealing with torrents
				//page.appendItem("", "separator", { title: "Quality Selected: " + quality });

				var item = magnetLink + " - " + quality + " - " + seederCount + " - " + codec;
				results.push(item);
			}
		} else {
			// Sort nonMatchedFiles by the length of the title
			nonMatchedFiles.sort(function(a, b) {
				return a.title.length - b.title.length;
			});

			if (nonMatchedFiles.length > 0 && !episodeIdentifier) {
				for (var i = 0; i < nonMatchedFiles.length; i++) {
					var magnetLink = nonMatchedFiles[i].item;
					var quality = nonMatchedFiles[i].quality;
					var codec = nonMatchedFiles[i].codec;
					var seederCount = '60'; // Dummy value - since we're not actually dealing with torrents
					//page.appendItem("", "separator", { title: "Quality Selected: " + quality });

					var item = magnetLink + " - " + quality + " - " + seederCount + " - " + codec;
					results.push(item);
				}
			} else {
				return [];
			}
		}
		page.loading = false;
		return results;
	} else {
		return [];
	}
} catch (error) {
	//showtime.trace("Error fetching data from Internet Archive: " + error);
	page.loading = false;
	return [];
}