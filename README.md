Instawhatsapp
=============

[![Build Status](https://travis-ci.org/yannrouillard/instawhatsapp.svg?branch=master)](https://travis-ci.org/yannrouillard/instawhatsapp)
[![Known Vulnerabilities](https://snyk.io/test/github/yannrouillard/instawhatsapp/badge.svg)](https://snyk.io/test/github/yannrouillard/instawhatsapp)
[![Maintainability](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability)](https://codeclimate.com/github/codeclimate/codeclimate/maintainability)


A CLI tool that forwards your Instagram posts to one or more Whatsapp groups.


How to install it
-----------------

*Instawhatsapp* must for now be directly installed from source:

    git clone git@github.com:yannrouillard/instawhatsapp.git
    cd instawhatsapp
    npm install --global


How to use it
-------------

Before beginning to synchronize posts, you must first authorize *instawhatsapp*
to use the WhatsApp web client.

To do that, just run the following command:

    instawhatsapp authorize <WHATSAPPACCOUNT>

where `WHATSAPPACCOUNT` is an arbitrary name that will be used to identify your account
in *instawhatsapp*.

*instawhatsapp* will then display on the terminal the QR code that you must scan with
your phone in order to authorize *instawhatsapp*. 
This is the same procedure used to authorize WhatsApp web client.

You can then launch the synchronization by launching the following command:

    instawhatsapp sync --instagram-password <INSTAGRAMPASSWORD> <INSTAGRAMACCOUNT> <WHATSAPPACCOUNT> <WHATSAPPGROUP>

where `WHATSAPPACCOUNT` must be the same identifier that you used during the authorization step.

If you want to avoid, you can also put in the file `credentials.json` under *instawhatsapp* data folder
This file has the following format:

```json
{
    "instagram_account1_name": "instagram_account1_password",
    "instagram_account2_name": "instagram_account2_password"
}

```

*Note*: *instawhatsapp* data folder is:
  * `$HOME/.local/share/instawhatsapp/` under linux
  * `/Users/yann/Library/Application Support/instawhatsapp/` under MacOS X



Caveats
-------

Be aware of the following caveats when using this application:

* **Instawhatsapp is fragile and may break at any time**

  *Instawhatsapp* uses web-scraping-like techniques to control WhatsApp through its
  web client. This is by essence fragile as any change in WhatsApp Web client HTML
  could break the application at any time.

* **Instawhatsapp will other interrupt existing Whatsapp web client session when running**

  As there can only be one WhatsApp Web client active at any moment for any account,
  running *instawhatsapp* will automatically suspend the other active WhatsApp web client
  when sending media to the target WhatsApp group.


Contributing
------------

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/yannrouillard/instawhatsapp/issues/new)

Author
------

**Yann Rouillard**

License
-------

Copyright © 2018 Yann Rouillard

Released under the GPLv3 license.
