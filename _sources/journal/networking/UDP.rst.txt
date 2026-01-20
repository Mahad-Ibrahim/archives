=======================
UDP: The "Thin Wrapper"
=======================

Inside the OS, a UDP packet is just an IP address with a port number. That is literally what it can be reduced to. It does not care about accuracy, and it is used when *"I just need this data sent fast. I don't care if it's 100% accurate."*

**UDP is a connectionless protocol.**
What does connectionless mean? It means the OS does not keep track of it at all. It just sends the packet and forgets about it.
"Did it arrive okay?" The OS does not care.
"Maybe I should ACK back to the sender's UDP packet to tell him I got it." The OS *does not care.*

The C Struct Definition
=======================

This is located inside of ``netinet/udp.h``, and it looks like:

.. code-block:: c

   struct udphdr {
       uint16_t source;  // Source Port
       uint16_t dest;    // Destination Port
       uint16_t len;     // Length (Header + Data)
       uint16_t check;   // Checksum
   };

1. **Source Address:** Optional. It can be empty just if you just want to "Throw" a packet out i.e one-way broadcast.
2. **Destination Address:** Required. You need to put the Port of the place you want to send the packet to.
3. **Length:** Required. The total size (Header + Payload). Minimum is 8 bytes, just the header.
4. **Checksum:** Optional in IPv4. Mandatory in IPv6. It checks for bit errors "Noise". Not lost packets.

----

Deep Dive: The "Pseudo-Header"
==============================

The OSI model demands strict separation:
* **IP (Layer 3)** handles Source/Dest IP Addresses.
* **UDP/TCP (Layer 4)** handles Source/Dest Ports.

**The Problem:** Imagine a buggy router. It receives a UDP packet meant for ``192.168.1.5`` but accidentally forwards it to ``192.168.1.99``.
* The **IP Layer** at .99 accepts it (because it just looks at the bits).
* The **UDP Layer** at .99 looks at the port (e.g., Port 80). If .99 happens to have a web server running, it accepts the packet.

**Result:** You just injected garbage data into the wrong server because UDP/TCP usually don't look at IP addresses.

The Solution: Virtual Verification
----------------------------------
To prevent this, a **"Pseudo-Header"** is created by the OS. The Transport Layer MUST verify the IP address, even though it's "not its job."
The Solution: Virtual Verification
----------------------------------

To prevent this, a **"Pseudo-Header"** is created by the OS. The Transport Layer MUST verify the IP address, even though it's "not its job."

.. important:: KERNEL MEMORY SNAPSHOT (RAM ONLY)

   The Kernel builds a temporary struct in the CPU registers. It contains the **IP Addresses** borrowed from Layer 3.
   
   **Visualizing the 12-Byte Virtual Structure:**

   .. code-block:: text
      :name: pseudo-header-map

        0      7 8     15 16    23 24    31
       +--------+--------+--------+--------+
       |          Source IP Address        |  <-- 4 Bytes (Layer 3)
       +--------+--------+--------+--------+
       |       Destination IP Address      |  <-- 4 Bytes (Layer 3)
       +--------+--------+--------+--------+
       |  ZERO  | Proto  |   UDP Length    |  <-- 4 Bytes (Meta)
       +--------+--------+--------+--------+
                ^        ^
                |        |
         Padding (0)   Protocol 17 (UDP)

   The Checksum is calculated over this **Virtual Header + Real Header + Data**. If the IP is wrong, the Checksum fails.


----

The Sealed Envelope (End-to-End Principle)
==========================================

If we already have a checksum on the Ethernet Layer (Data Link Layer), why do we need *another* Checksum on the UDP layer (Network Layer)?

It seems redundant, you have a checksum which validates the data on the lower layers already, why would you need to do it again on the higher layers?

It comes down to one core difference. **Ethernet (Data Link) Layer's CRC is Hop-to-Hop, UDP (Network) Layer's checksum is End-to-End.** This is the one difference that makes it important, and it is a very intelligent design.

Imagine a packet traveling from **A → Router → B**.

Link A-Router
-------------
Data is valid on the wire. Ethernet CRC passes.
The Router accepts the packet into its RAM.

Inside the Router (The Danger Zone)
-----------------------------------

.. danger:: THE NAKED PACKET

   **CRITICAL:** The Router strips off the Ethernet Header (and the CRC). The packet sits **naked** in the Router's RAM buffer.

   **Scenario:** The Router has a bad RAM stick. A single bit flips inside the packet payload while it is waiting in the queue.

   The Router builds a *new* Ethernet frame for the next hop. It calculates a *new* Ethernet CRC based on the **now-corrupted data**.

Link Router-B
-------------
The packet is sent to B.
B receives it. The Ethernet CRC **PASSES** (because it matches the corrupted data sent by the router).

**Result:** Without the UDP Checksum, you just received a corrupted file, and the network told you it was perfect.

The Solution
------------
The UDP checksum is calculated *once* at the source and remains untouched for the entire duration of the packet's life.

* It seals the **IPs (Pseudo-Header)** AND the **Data (Payload)** together.
* If a router corrupts the data in transit, the final UDP Checksum verification at the destination will fail, even if the Ethernet CRC says "the last wire jump was fine."
