exports.handler = (event, context, callback) => {

    console.log('starting');

    //setup the environment variables - unfortunately, Lambda@Edge cannot use
    //true environment variables
    //config is targeted to move to an array to support forwarding to multiple
    //hosts, after a discussion with the customer
    //config format:  host = host to forward to, error_page = error page, in case of issues
    //              campaign_over_page = page for show when the campaign has expired
    //rules format:  uri from the origin site is the variable for the rule
    //              rewrite = uri to rewrite to
    //              startdate/enddate = campaign effective dates in mm/dd/yyyy
    const forwarding = {
	"config": {
		"host": "http://awstburlrewrite.s3-website-us-east-1.amazonaws.com/",
		"error_page": "error.html",
		"campaign_over_page": "campaignover.html"
	},
	"rules": {
		"/test1": {
			"rewrite": "testpage1.html",
			"startdate": "12-01-2017",
			"enddate": "12-31-2017"
		},
		"/test2": {
			"rewrite": "testpage2.html",
			"startdate": "12-12-2017",
			"enddate": "01-12-2018"
		},
		"/test3": {
			"rewrite": "testpage3.html",
			"startdate": "11-01-2017",
			"enddate": "11-30-2017"
		}
	}
};

    //get the uri from the requested page
    var origin_uri = event.Records[0].cf.request.uri;
    var site = forwarding['config']['host']
    var page = forwarding['config']['error_page'];   //by default, will always redirect somewhere

    var currDate = new Date();
    console.log(origin_uri);
    if(origin_uri in forwarding['rules']){
        var startDate = new Date(forwarding['rules'][origin_uri]['startdate']);
        var endDate = new Date(forwarding['rules'][origin_uri]['enddate']);

        if ((currDate >= startDate) &&
           (currDate <= endDate))
        {
            //good redirect
            page=forwarding['rules'][origin_uri]['rewrite'];
            console.log('Sending Redirect: ' + site + page);
        }
        else
        {
            page=forwarding['config']['campaign_over_page']
        }
    }
    //build response and send the 302
    callback(null, redirect(site + page));

}


function redirect (to) {
  return {
    status: '301',
    statusDescription: 'Moved Permanently',
    headers: {
      'cache-control': [{ key: 'Cache-Control',value: 'max-age=30' }],
      location: [{ key: 'Location', value: to }]
    }
  }
}
