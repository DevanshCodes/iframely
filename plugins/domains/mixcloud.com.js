const cheerio = require('cheerio');
const querystring = require('querystring');
const URL = require("url");

module.exports = {

    mixins: [
        "oembed-title",
        "oembed-description",
        "oembed-author",
        "oembed-site",
        //"oembed-rich",
        "domain-icon"
    ],

    getLink: function (oembed, whitelistRecord, options) {

        // let Whitelist/default fallbacks take control if oEmbed fails
        if (!(oembed.type === "rich" && whitelistRecord.isAllowed && whitelistRecord.isAllowed('oembed.rich'))) {
            return;
        } else {

            var widget = {
                rel: [CONFIG.R.oembed, CONFIG.R.html5],
                type: CONFIG.T.text_html
            };

            var $container = cheerio('<div>');
            try {
                $container.html(oembed.html);
            } catch (ex) {}

            var $iframe = $container.find('iframe');

            if ($iframe.length == 1) {

                var href = $iframe.attr('src');

                if (/\/widget\/follow\//.test(href)) {
                    widget.href = href;
                    widget.rel.push(CONFIG.R.summary);
                    widget.width = oembed.width;
                    widget.height = oembed.height;

                } else {

                    var params = URL.parse(href, true).query;
                    var style = options.getRequestOptions('mixcloud.style', params.mini == 1 ? 'mini' : (params.hide_cover == 1 ? 'classic' : 'cover'));

                    if (options.getRequestOptions('mixcloud.light', params.light)) {
                        params.light = 1;
                    }

                    if (options.getRequestOptions('mixcloud.hide_artwork', params.hide_artwork)) {
                        params.hide_artwork = 1;
                    }                    

                    if (style === 'mini') {
                        params.mini = 1;
                        params.hide_cover = 1;
                    } else if (style === 'classic') {
                        delete params.mini;
                        params.hide_cover = 1;
                    } else if (style === 'cover') {
                        delete params.mini;
                        delete params.hide_cover;
                        delete params.light;
                        delete params.hide_artwork;
                    }

                    widget.href = href.replace(/\?.+/, '') + querystring.stringify(params).replace(/^(.)/, '?$1');
                    widget.autoplay = 'autoplay=1';                    

                    // mixcloud ignores &mini=1 if there's no &hide_cover=1.
                    widget.height = !/&?hide_cover=1/i.test(widget.href) ? 400 : (/&?mini=1/i.test(widget.href) ? 60 : 120);
                    widget.scrolling = "no";
                    widget.rel.push(CONFIG.R.player);
                    widget.rel.push(CONFIG.R.auido);

                    widget.options = {
                        style: {
                            label: 'Size & style',
                            value: style,
                            values: {
                                'mini': 'Mini widget',
                                'classic': 'Classic widget',
                                'cover': 'Picture widget'
                            }
                        }
                    };

                    if (style !== 'cover') {
                        widget.options.light = {
                            label: 'Light theme',
                            value: params.light === 1
                        };
                        widget.options.hide_artwork = {
                            label: 'Hide artwork',
                            value: params.hide_artwork === 1
                        };

                    }
                }                

                return [widget, {
                    href: oembed.image, 
                    type: CONFIG.T.image, 
                    rel: CONFIG.R.thumbnail
                }]
            }
        }

    },

    tests: [{noFeeds: true}, {skipMixins: ["oembed-description"]},
        "https://www.mixcloud.com/djtraviesa/"
    ]
};