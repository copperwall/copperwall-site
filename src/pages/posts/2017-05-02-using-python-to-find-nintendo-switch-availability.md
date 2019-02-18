---
layout: post
title:  "Using Python/Pushbullet to find Nintendo Switch Availability"
date:   2017-05-02 22:00:00
categories: python
---
This isn't super relevant with the increased Nintendo Switch availability, but I thought I'd document the process I used to make an automated in-stock notifier for Target. The main point about talking about this is how you can make a pretty useful tool with a couple lines of Python.

### Grabbing the data

I started out this project expecting to have to scrape the HTML from the availability page on Target.com. Doing this would require grabbing the page using something like `urllib.urlopen` and then parsing the HTML using something like `lxml` or `BeautifulSoup` and then using a CSS selector to find the fields of interest in the document. However, if you open up the network tab and filter by XHR requests, you can see that the webpage does a request to [api.target.com](https://api.target.com), which returns a JSON document of which stores have stock in the area around your zipcode.

![network tab](https://devopps.me/static/network_tab.png)

Now that we know there's a working API endpoint, we don't need to use extra modules like `lxml` or `BeautifulSoup` to parse HTML. We can parse the data using the `json` module and `json.loads`. This portion of the JSON document looks promising.

~~~ json
"locations": [
        {
          "location_id": "2759",
          "location_type": "STORE",
          "distance": "0.00",
          "store_name": "San Luis Obispo",
          "store_address": "11990 LOS OSOS VALLEY RD San Luis Obispo CA 93405",
          "formatted_store_address": "11990 LOS OSOS VALLEY RD, San Luis Obispo, CA 93405",
          "store_main_phone": "805-858-9902",
          "location_available_to_promise_quantity": 0,
          "location_available_to_release_quantity": 0,
          "inventory_type": "STORES",
          "onhand_quantity": 0,
          "location_demand_sum": 0,
          "location_soft_demand_sum": 0,
          "location_hard_demand_sum": 0,
          "location_transfer_demand_sum": 0,
          "location_supply_adjustment_sum": 0,
          "product_location_threshold_quantity": 0,
          "product_location_pickup_walkin_reserve": 200,
          "availability_status": "OUT_OF_STOCK",
          "multichannel_options": [
            "HOLD",
            "SHIPGUEST",
            "SHIPSTORE"
          ]
        },
        ...
    ]
~~~

We have a list named **Locations** that contains a **store_name** which is named after the city, and an **availability_status**, which is currently **"OUT_OF_STOCK"**. Hey, that's pretty good.

Using the information we have so far, we can write a python script that looks a little like:

~~~ python
import urllib.request
import json

class Target:
    api_url = "Target API URL goes here"
    user_agent = "Target doesn't like the default urllib User-Agent, so make you're own"

    def get_location_availability(self):
        ''' Gets the in store availability for a grey switch near your zipcode
            This takes the JSON response and loads it into a python dictionary and
            returns the relevant 'locations' field.
        '''
        req = urllib.request.Request(Target.api_url)
        req.add_header('User-Agent', Target.user_agent)

        with urllib.request.urlopen(req) as res:
            json_data = json.loads(res.read().decode('utf-8'))
            return json_data['products'][0]['locations']

    def get_available_stores(self):
        store_availabilities = self.get_location_availability()

        # Filter out stores that have an availability of "OUT_OF_STOCK"
        in_stock = list(filter(lambda store: store['availability_status'] != "OUT_OF_STOCK", store_availabilities))
        # Map the list of store statuses to a list of store name strings
        return list(map(lambda store: store['store_name'], in_stock))

if __name__ == "__main__":
    target = Target()

    # At this point stores is a list of store names that are not OUT_OF_STOCK.
    stores = target.get_available_stores()
~~~

### Handling Push Notifications

The main utility behind this is that it notifies you in realtime, so that you don't need to take time everyday to check product availability listings. You could use email, or twilio for sms, or a slack bot, or pushbullet, or whatever push notification service you feel like. I used pushbullet because it's pretty easy.

To set up Pushbullet, create an account and go to [https://www.pushbullet.com/#settings](https://www.pushbullet.com/#settings) and create an API Access Token. Using this token you can send a push notification from the Python script.

To install the Pushbullet, run `pip install pushbullet.py`.

A really simple push notification script looks like:

~~~ python
from pushbullet import Pushbullet

pb_api_key = "Your API Access Token"
pb = Pushbullet(pb_api_key)

title = "Test"
message = "hey wow"
pb.push_note(title, msg)
~~~

If you have Pushbullet installed on your phone, you should get a notification with the title and text sent in the example script.

Here's an updated version of the Target script with a new method for sending a list of store names that have a non **OUT_OF_STOCK** status.

~~~ python
import urllib.request
import json
from pushbullet import Pushbullet

class Target:
    api_url = "Target API URL goes here"
    user_agent = "Target doesn't like the default urllib User-Agent, so make you're own"

    def get_location_availability(self):
        ''' Gets the in store availability for a grey switch near your zipcode
            This takes the JSON response and loads it into a python dictionary and
            returns the relevant 'locations' field.
        '''
        req = urllib.request.Request(Target.api_url)
        req.add_header('User-Agent', Target.user_agent)

        with urllib.request.urlopen(req) as res:
            json_data = json.loads(res.read().decode('utf-8'))
            return json_data['products'][0]['locations']

    def get_available_stores(self):
        store_availabilities = self.get_location_availability()

        # Filter out stores that have an availability of "OUT_OF_STOCK"
        in_stock = list(filter(lambda store: store['availability_status'] != "OUT_OF_STOCK", store_availabilities))
        # Map the list of store statuses to a list of store name strings
        return list(map(lambda store: store['store_name'], in_stock))

# New Stuff
def push_notifications(stores):
    # Don't send a notification if no stores have it in stock.
    if not stores:
        return
    pb_api_key = "Your API Access Token"
    pb = Pushbullet(pb_api_key)

    title = "Switch Checker"
    msg = "Switches in stock at: " + ",".join(stores)

if __name__ == "__main__":
    target = Target()

    # At this point stores is a list of store names that are not OUT_OF_STOCK.
    stores = target.get_available_stores()
    # Send a notification with the in stock store names.
    push_notifications(stores)
~~~

At this point we've got a fully-functioning script! Woo.

### Running the script periodically

So far there's nothing in the script that has it run automatically or at a certain interval. One option is to use Cron to run the script once a day in the morning.

To edit your **crontab**, type `crontab -e` on a Unix-like machine. It'll open up an editor and you can put something like

~~~sh
0 8 * * * /path/to/your/python/script
~~~

That'll run the script every morning at 8AM. You can also have the python script loop forever, but sleep for a day or an hour or so between iterations. That'd look something like.

~~~ python
from time import sleep

if __name__ == "__main__":
    target = Target()

    while True:
        # At this point stores is a list of store names that are not OUT_OF_STOCK.
        stores = target.get_available_stores()
        # Send a notification with the in stock store names.
        push_notifications(stores)
        # Sleep a day
        sleep(86400)
~~~

Hopefully if you're still trying to get a Switch, this can help your search be a little less stressful. Thanks for reading. Also don't spam the Target API because you'll get rate-limited and it's not super nice.
