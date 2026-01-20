================================
Data Link Control & Flow Control
================================

The Critical Problem: Speed Mismatch
====================================

**The Problem**

If two machines have incompatible processing resources, and one machine overwhelms the other by constantly sending data, the receiving machine will have to drop frames because its buffer is already full. The frame essentially has nowhere to go.

**The Solution**

We need a mechanism that controls this flow/interchange of data so that neither machine can get overwhelmed. We can achieve this by relying on a simple idea: **Feedback**.

----

Stop-and-Wait Flow Control
==========================

The simplest type of flow control. It basically just sends a packet to the receiver, the receiver says *"Hey I got it (ACK)"* back to the sender, and the sender only then sends the next packet.

**Pseudocode Logic**

.. code-block:: c

    while(1){
        send_frame(data);
        wait_for_interrupt(ACK); // CPU Blocks here
    }

**The Flaw**

The main flaw in Stop-and-Wait is that it is **extremely inefficient**. On very long distances, 99% of the wire is completely empty, as only 1 packet can be on the wire at any time. However, it is very robust and simple to implement.

----

.. important:: ACK and SEQ Fields (The C Struct Reality)

   In the most simple of forms, packets are **C structs**. The C struct cannot change layout just because you do not have an ACK to send. **Both these fields MUST be filled.**

   * **ACK (Acknowledgment Number):** Represents *"I have received everything up to this number"*. It refers to the **incoming** data.
   * **SEQ (Sequence Number):** Represents the ID of **this specific packet** being sent. It refers to the **outgoing** data.

   *Key Takeaway:* SEQ and ACK are independent. SEQ identifies the packet itself. ACK confirms what has been received from the other side.

----

Sliding Window Flow Control (The Successor)
===========================================

This solves the inefficient "empty pipe" problem of Stop-and-Wait.

**How?**

It pushes multiple frames onto the wire *before* ever receiving the first ACK. As soon as it receives the first ACK, it 'slides' its window to the right to accommodate more.

**What if an ACK is missed?**

The window's movement is strictly defined by the oldest unacknowledged frame. Meaning it *cannot* 'slide' forward until the oldest awk

1. If ``ACK 2`` is lost, the sender's window pointer for Frame 2 **cannot move**.
2. Even if ``ACK 3`` arrives, the system assumes the sequential order is broken at 2.
3. The sender **DOES NOT** slide the window. It waits (and eventually times out) until ``ACK 2`` is explicitly received. The window is effectively "stuck" at the missing frame.

.. note:: Dual Windows
   In a full-duplex connection, there are **2 windows** in the network. One on the sender side and one on the receiver side. Both sides maintain their own personal sliding windows.

----

Piggybacking (Optimization)
===========================

**The Problem**

In both Stop-and-Wait and Sliding Window, communication is bidirectional.
(Scenario: A sends Data → B sends ACK → B sends Data → A sends ACK).
Every "ACK" packet requires a full Ethernet/IP header (min 64 bytes) just to say "Yes." This is a huge waste of bandwidth.

**The Concept**

Instead of sending a separate control frame just for ACK, we attach the ACK to the **next outgoing data frame**.

* **Implementation:** The Frame Header has a specific field called ``Ack Sequence Number``.
* **Scenario:** B receives a frame from A. When B builds its own data packet to send back, it sets ``ACK = 1`` inside that header.

Edge Cases
==========

Case A: No new data to send?
----------------------------
**Problem:** You (Station B) received a packet from A. A is running a retransmission timer. If you wait for your application to generate a "reply" payload to piggyback the ACK on, A's timer might expire.

**Solution:** You strip the payload and only send the header (Control Frame).

* **RR (Receive Ready):** "I acknowledge all frames up to N. I am ready for N+1." (Standard ACK).
* **RNR (Receive Not Ready):** "I acknowledge up to N, but **STOP**. My buffers are full." (ACK + Flow Control Stop).

Case B: Data to send, but no new ACK?
-------------------------------------
**Problem:** You (Station B) are uploading a large file to A. A is just listening. You sent ``ACK=5`` in your previous packet. Now you need to send the next chunk of your file, but A has not sent any new data back to you.

**Constraint:** The Header has a 32-bit field for Acknowledgment Number. It cannot be empty.

* You cannot put ``6`` (Because A has not sent Frame 6 yet).
* You cannot put ``0`` (That looks like a reset).

**Solution:** **You copy-paste the last valid ACK you sent (ACK=5).**

When A receives this, it sees ``ACK=5`` again. It compares it to its state ("I already received ACK 5"). It realizes this is a duplicate confirmation. It **discards the ACK information** (takes no action on the window) but **accepts the Data payload**. This ensures the protocol creates no false positives.
