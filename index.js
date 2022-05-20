const twit = require('twit');
const config = require('./config.js')
const Sentiment = require('sentiment')
const sentiment = new Sentiment()
const fs = require('fs')

const Twitter = new twit(config)

async function getTweets(recipient){
    let params = {
        q: `@${recipient.competitor}%20${recipient.username}`,
        count: '1',
        result_type: 'recent',
        tweet_mode: 'extended',
        lang: 'en'
    };
    let tweets = await Twitter.get('search/tweets', params)
    return tweets.data.statuses
};

const get_text = (tweet) => {
    let txt = tweet.retweeted_status ? tweet.retweeted_status.full_text : tweet.full_text;
    return txt.split(/ |\n/).filter(v => !v.startsWith('http')).join(' ');
 };


const tweetId = (tweet) => tweet[0].id

const customerAccount = (tweet) => tweet[0].user.screen_name

const storeNewPost = (appendedArray) => {
    fs.writeFile('target.json', JSON.stringify(appendedArray, null, 4), (err) => {
        if(err) console.error(err)
    });
}


async function main(query){
    let tweet = await getTweets(query)
    let postId = tweetId(tweet)
    fs.readFile('target.json', (err, data) => {
        let read = JSON.parse(data)
        if(read.posts.indexOf(postId) === -1) {
            read.posts.push(postId)
            storeNewPost(read)
            let tweetContent = tweet.map(get_text)
            const score = sentiment.analyze(tweetContent[0]).comparative
            if(score < 0) {
                sendDirectMessage(query)
            };
        } else {
            console.error('tweet already stored, account likely already DMed')
        };
     });
    
};


const postUpdate = (status) => {
    Twitter.post('statuses/update', {status: `@${recipient} ${status}`}, (error, tweet, response) => {
        error ? console.log(error) : console.log('tweeted sucessfully')
    })
}

const recipientAccounts = [
    {username: 'account1generic', id: "1067453816021372930", competitor: 'telecom 1', message: function() { return `Hey ${this.username}, unhappy with your ${this.competitor} service?  Switch to PROVIDER today and get R1000! https://url`}}, 
    {username: 'generic2account', id: "1067457498955870208", competitor: 'telecom 2', message: function() { return `Hey ${this.username}, unhappy with your ${this.competitor} service?  Switch to PROVIDER today and get R1000! https://url`}},
    {username: 'account3generic', id: "1067458049919594496", competitor: 'telecom 3', message: function() { return `Hey ${this.username}, unhappy with your ${this.competitor} service?  Switch to PROVIDER today and get R1000! https://url`}},
    {username: 'account4generic', id: "1068185239103639552", competitor: 'telecom 4', message: function() { return `Hey ${this.username} we're really sorry about your experience! We'll make it up to you! Please use this offer code 9999 upon checkout when you recharge your phone: https://url`}}
];



const sendDirectMessage = (recipient) => {

    let dmParams = { 
        event: { 
            type: 'message_create', 
            message_create: {
                target: {
                    recipient_id: recipient.id
                }, 
                    message_data: {
                        text: recipient.message()
                    }
                }
            }
        };

    Twitter.post('direct_messages/events/new', dmParams)
};


main(recipientAccounts[2])



exports.handler = (event, context, callback) => {
     
     callback(null, 'ok');
};
