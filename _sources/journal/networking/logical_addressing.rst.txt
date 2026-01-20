Logical Addressing (IPv4)
=========================

Primitive Era: Classful Addressing
----------------------------------

In the beginning of networks, engineers thought "Routing is hard. Let's make the IP address tell us exactly how big the network is just by looking at the first few bits."

They hardcoded the network mask on the MSBs of the IP addresses.

.. admonition:: SYSTEM LEGACY
   :class: caution

   The logical architecture was rigid. The IP address *was* the network definition.

The Classes
^^^^^^^^^^^

.. list-table::
   :widths: 15 20 20 20 25
   :header-rows: 1

   * - Class
     - Binary ID
     - Mask
     - Capacity
     - Logic
   * - **Class A**
     - ``0...``
     - ``/8``
     - 16M Hosts
     - "I am a massive network."
   * - **Class B**
     - ``10...``
     - ``/16``
     - 65,534 Hosts
     - "I am a medium network."
   * - **Class C**
     - ``110...``
     - ``/24``
     - 254 Hosts
     - "I am a small network."

**Class D:** ``1110...`` (Multicast)
**Class E:** ``1111...`` (Reserved/Experimental)

.. admonition:: FLAW
   :class: error

   **Address Depletion:** Class C addresses ran out. Class B addresses ran out. Class A addresses were unused and wasted.

----

The Modern Era: Classless Addressing (CIDR)
-------------------------------------------

CIDR (Classless Inter-Domain Routing) abolished the "Fixed Classes." The IP did not decide the network, the subnet mask did.

.. note::
   **Notation:** ``IP_address/n``

   * **n (Prefix Length):** Bits set to 1.
   * **Block Size:** :math:`N = 2^{32 - n}`

Example: 192.168.1.0/26
^^^^^^^^^^^^^^^^^^^^^^^
* **Mask:** 26 bits
* **Host Bits:** :math:`32 - 26 = 6`
* **Total IPs:** :math:`2^6 = 64`

Bitwise Numericals
------------------

SCENARIO TARGET
^^^^^^^^^^^^^^^
205.16.37.39/28

**Objective:**
   * Network ID (First)
   * Broadcast ID (Last)
   * Capacity


SOLUTION
^^^^^^^^

**Step 1: The Mask (The Filter)**
``/28`` means 28 1s.
Decimal: ``255.255.255.240``

.. code-block:: text
   :caption: TERMINAL: BITWISE_AND_OP

   INPUT:
     IP  (39) :  0010 0111
     MASK(240):  1111 0000
   -----------------------
     AND RESULT: 0010 0000  (32) -> Network ID

.. code-block:: text
   :caption: TERMINAL: BITWISE_OR_OP

   INPUT:
     NET (32) :  0010 0000
     INV (15) :  0000 1111
   -----------------------
     OR RESULT:  0010 1111  (47) -> Broadcast ID

**Result:**
``Network: 205.16.37.32`` | ``Broadcast: 205.16.37.47`` | ``Hosts: 16``

Hierarchy: Subnetting a Subnet
------------------------------

.. tip:: THE GOLDEN RULE

   To split an ``/n`` network into **2 subnets**, you must **Borrow 1 Bit**.
   **New Mask:** ``/n+1``

   To split an ``/n`` network into **4 subnets**, you must **Borrow 2 Bits**.
   **New Mask:** ``/n+2``
