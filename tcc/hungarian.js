'use strict';

// const { Observable, from, of } = require('rxjs');
// const { map, mergeMap, tap, concatMap, bufferCount, debounceTime, concatAll } = require('rxjs/operators');

const Nightmare = require('nightmare');
const fs = require('fs');

const nightmare = Nightmare();

const uniq = require('lodash/uniq');
const flattenDeep = require('lodash/flattenDeep');
const cloneDeep = require('lodash/cloneDeep');

async function fetchHomePageLinks(url) {

	const links = await nightmare.goto(url)
		.scrollTo(999999999, 0)
		.wait(1000)
		.evaluate(() => new Array(...document.querySelectorAll('li.item a.ui_link')).map(el => [ el.href ]))
		.catch(err => (console.log(err), []));

	return flattenDeep(cloneDeep(links));
}

async function fetchFilterPageLinks(url) {

	const links = await nightmare.goto(url)
		.scrollTo(999999999, 0)
		.wait(1000)
		.evaluate(() => new Array(...document.querySelectorAll('a.property_title')).map(el => [ el.href ]))
		.catch(err => (console.log(err), []));

	return flattenDeep(cloneDeep(links));
}

async function fetchPagePosts(url) {

	return await nightmare.goto(url)
		.wait('body')
		.click('div.review-container p.partial_entry span.ulBlueLinks:first-child')
		.wait(100)
		.scrollTo(999999999, 0)
		.wait(500	)
		.evaluate(() => new Array(...document.querySelectorAll('p.partial_entry')).map(el => ({
			title: document.title, text: el.innerText, link: document.URL, source: 'tripadvisorhu'
		})))
		// .catch(err => (console.log(err), []));
		.catch(err => []);
}

async function crawler(baseURL) {
	console.log('getting the links...');

	const t0 = Date.now();
	const links = await fetchHomePageLinks(baseURL);
	var DATASET = [];
	console.log(`Got ${links.length} links, now grab the posts`);

	for (let i = 0; i < links.length; i++) {
		const url = links[i];

		const pages = await fetchFilterPageLinks(url);

		console.log(`Got ${pages.length} post pages`);

		for (let i = 0; i < pages.length; i++) {
			const url = pages[i];
			const data = await fetchPagePosts(url);
			DATASET.push(...data);
		}

		console.log(`Parsed ${i+1} of ${pages.length}`);
	}

	fs.appendFile('hungarian.txt', JSON.stringify(DATASET, null, 1), (err) => {
		if (err) throw err;
		const t1 = Date.now();
		console.log(DATASET.length, 'POSTS CRAWLED in', ((t1 - t0) / 60 / 1000));
	});

	await nightmare.end();
	console.log('DONE');
	process.exit();

}

crawler('https://www.tripadvisor.co.hu');