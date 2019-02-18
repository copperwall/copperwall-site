---
layout: post
title: How to make an old printer a networked printer
date: 2016-10-08 18:00:00
categories: how-to
---

I recently became the proud owner of a hand me down [HP LaserJet 1020](http://support.hp.com/us-en/product/HP-LaserJet-1020-Printer-series/439423). It's a fairly basic laser printer that prints in black and white, and only has a USB 2.0 interface. I was happy to take it, since I only really print text documents and I wouldn't have to spend a ridiculous amount of money on printer ink, but I wanted a printer that I could use from my laptop or my desktop. I also did not want to have to depend on my desktop or laptop to be on for the printer to receive print jobs. I had an unused Raspberry Pi 2 sitting around, so I thought that using the Raspberry Pi as a print server would do the trick.

### Setting up the Pi

The first step to getting a networked printer was to install Linux on the Raspberry Pi. I chose to use the [Raspian Jessie Lite](https://www.raspberrypi.org/downloads/raspbian/) image. Since I'm not planning on running a display server on this Pi, I chose to dedicate the smallest split of RAM to video.

Once the Pi was up and running I plugged in the printer to the Pi and installed CUPS.

### Installing/Configuring CUPS

To install CUPS run

~~~ sh
sudo apt install cups
~~~

Once CUPS is installed, it's helpful to add your current user to the `lpadmin` user group so that you can do administrative actions within the CUPS web UI.

To add your user to the `lpadmin` group run

~~~ sh
# Using the pi user as an example
sudo usermod -a -G lpadmin pi
~~~

It is also helpful to edit the CUPS config file to have CUPS listen on a port so that you can access it's configuration UI from another computer.

In `/etc/cups/cupsd.conf` find a line that looks like

~~~
Listen localhost:631
~~~

Comment that line out and add new line that says `Port 631`. The config file should like this at this point.

~~~
# Listen localhost:631
Port 631
~~~

Following that, add a line `Allow @local` to the `Location` blocks further down in the config file. It should look like

~~~
< Location / >
# Restrict access to the server...
Order allow,deny
# Add this line here
Allow @local
< /Location >

< Location /admin >
# Restrict access to the admin pages...
Order allow,deny
# Add this line here
Allow @local
< /Location >

< Location /admin/conf >
AuthType Default
Require user @SYSTEM

# Restrict access to the configuration files...
Order allow,deny
# Add this line here
Allow @local
< /Location >
~~~

**_DISCLAIMER:_** This means that any one on your LAN can view the CUPS web UI. They still need your system user password to do administrative tasks, but they can view some printer statuses.

After this, restart CUPS using the command

~~~ sh
sudo systemctl restart cups
~~~

Now you can access the CUPS web UI by going to `http://<your pi's ip address>:631`.

Click the `Add Printer` button and login with your system username and password.

Look for your printer in the Local Printers list. I checked the Share This Printer checkbox, but I'm not sure if that's necessary.

On the next screen, see if the list of models has an entry for your printer model. If you don't see your model, check to see if your model is supported by [foo2zjs](http://foo2zjs.rkkda.com/). My LaserJet 1020 did not have a driver in CUPS, so I downloaded the zipped archive for my printer from `foo2zjs`.

### Drivers from foo2zjs

To build a driver from `foo2zjs`

~~~ sh
tar xvf foo2zjs.tar.gz
cd foo2zjs
make
sudo make install
~~~

The `INSTALL` file will give you additional information about compiling and installing foo2zjs drivers.

After this you should restart CUPS again.

At this point you should be able to add your printer with the CUPS web UI using the `zoo2zjs` driver listed in the list of printer models in the Add Printer page.

### Printing from other computers

I was able to connect with this printer over OSX and Linux using the `ipp://<hostname>:631/printers/<printer_name>` address.

So, if your Pi's IP address is `192.168.2.2` and the printer name you gave your printer is `cool_printer`, the address would be `ipp://192.168.2.2:631/printers/cool_printer`.

For some reason I wasn't able to get this to work on Windows. I read a little that people have more luck sharing a printer using Samba, but I don't really use Windows enough to warrant the extra work.
