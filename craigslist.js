var craigslist = require('node-craigslist');
var nodemailer = require('nodemailer');
var config = require('./config.json');

var listingData;
var latestPostTime = 0;

var transporter = nodemailer.createTransport({
    service: config.emailServer,
    auth: config.auth
});

var client = new craigslist.Client({
    city: config.city
});

postNewListings();
setInterval(postNewListings, 300000);

function postNewListings() {
    listingData = [];
    searchPhrases = config.searchFor.split(", ");
    searchPhrases.forEach((phrase) => populateData(phrase));

    setTimeout(function() {
        if (listingData.length > 0) {
            updateLast();
            sendEmail(extractHTMLData());
        } else {
            console.log("No results");
        }
    }, 10000);

};

function populateData(query) {
    client
        .search(config.options, query)
        .then((listings) => {
            listings.forEach((listing) => {
                if (listing.hasPic) {
                    client
                        .details(listing)
                        .then((detail) => {
                            if (listing.title.includes(query)) {
                                addPost(listing, detail);
                            };
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                };
            });
        })
        .catch((err) => {
            console.error(err);
        });
}

function addPost(listing, detail) {
    // need to double check images is defined since hasPic isn't always
    // accurate, and check if already posted
    var postingTime = Date.parse(detail.postedAt);
    if (detail.images != undefined && postingTime > latestPostTime) {
        var list = {
            postingTime: postingTime,
            html: '<a href="' + listing.url + '">'
                + listing.title + '</a><p>' + detail.postedAt
                + '<br>' + listing.price + ' - '
                + detail.description.substring(0, 500)
                + '<br></p>' + '<img src=' + detail.images[0]
                + '>' + '<br><br>'
        };
        listingData.push(list);
    };
}

function updateLast() {
    listingData.sort((a, b) => (b.postingTime - a.postingTime));
    latestPostTime = listingData[0].postingTime;
}

function extractHTMLData() {
    var html = "";
    listingData.forEach((post) => html += post.html);

    return html;
};

function sendEmail(emailHtml) {
    emailHeader = config.emailHeader;
    var mailOptions = {
        from: emailHeader.sender,
        to: emailHeader.recipient,
        subject: emailHeader.subject,
        html: emailHtml
    }

    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    })
}
