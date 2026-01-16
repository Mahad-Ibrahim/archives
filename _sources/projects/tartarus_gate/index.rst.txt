Project Tartarus: Advanced Windows Implant Architecture
=======================================================

*A custom-built Adversary Emulation framework focusing on x64 syscall evasion and OS internals.*

Access and Project Status
-------------------------

While this repository hosts the source code for the core Implant Engine (Tartarus Gate) and the Assembly Network Stager, these are individual components of a larger, fully integrated Advanced Persistent Threat (APT) simulation.

The complete project—including the multi-hop C2 infrastructure, persistence mechanisms, and logic integration—is fully functional and complete. However, due to the sensitive nature of the code and the potential for misuse, the full source code is hosted in a private repository.

.. note::
   I am happy to provide access to the full private repository or a walkthrough of the complete architecture upon request for interview and verification purposes. Please contact me directly to arrange access.

Complete System Architecture
----------------------------

The following diagram illustrates the execution flow of the Tartarus Gate engine, from initial PEB walking to final syscall execution and C2 communication.

.. image:: /_static/images/Architecture-Diagram.png
   :alt: Tartarus Architecture Diagram
   :align: center
   :class: no-scaled-link

*Figure 1: High-level execution flow of the implant engine and network stager.*

Proof of Concept
----------------

A PoC x64 Windows implant that makes an HTTP POST request using direct syscalls and manual `PEB <https://learn.microsoft.com/en-us/windows/win32/api/winternl/ns-winternl-peb>`_ walking. Made to bypass user-mode API hooks by EDR/AV.

.. warning::
   This project was made for educational and research purposes only, attempting to showcase modern evasion techniques and Windows OS internals.

Key Technical Features
^^^^^^^^^^^^^^^^^^^^^^

* **Direct Syscall Execution:** Uses the `Tartarus Gate/Hell's Gate <https://redops.at/en/blog/exploring-hells-gate>`_ technique to find System Service Numbers (SSNs) while the program runs. This allows it to bypass antivirus hooks on ``Nt*`` functions.
* **Position Independent Code (PIC):** The code works from any memory address. It manually walks through the PEB and Kernel32.dll to find `GetProcAddress <https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getprocaddress>`_.
* **Wininet via Assembly:** It uses ``GetProcAddress`` to find the addresses of key networking functions.

x64 Tartarus Gate
-----------------

.. image:: https://img.shields.io/badge/Language-C%20%2F%20x64_Assembly-blue
   :alt: Language
.. image:: https://img.shields.io/badge/Platform-Windows-0078D6
   :alt: Platform
.. image:: https://img.shields.io/badge/Technique-Direct_Syscalls-red
   :alt: Technique

The source code for this is inside ``main.c``.

1. The PEB Walk
^^^^^^^^^^^^^^^

To avoid calling functions that might be monitored by antivirus software (AV/EDR), the loader does the following steps instead of using standard APIs:

1. **Reads the GS register** to find the `TEB (Thread Environment Block) <https://learn.microsoft.com/en-us/windows/win32/api/winternl/ns-winternl-teb>`_.
   
   .. note:: 
      In x86_64 Windows, the GS register is used to point to the current Thread Environment Block (TEB).

2. **Finds the PEB pointer** inside the TEB at offset ``0x60``.
   
   .. note:: 
      At offset 60h, there is a pointer named ``PPEB ProcessEnvironmentBlock``.

3. **Finds the** ``PPEB_LDR_DATA`` inside the PEB.
   
   .. note:: 
      Reference: `PEB_LDR_DATA Structure <https://learn.microsoft.com/en-us/windows/win32/api/winternl/ns-winternl-peb_ldr_data>`_

4. **Loops through the** ``InMemoryOrderModuleList`` to find the target DLL.
   
   .. note:: 
      The ``InMemoryOrderModuleList`` is a structure inside ``PEB_LDR_DATA``. It is a doubly linked list that connects all loaded modules. This is known as an `intrusive linked list <https://www.data-structures-in-practice.com/intrusive-linked-lists/>`_.

5. **Gets the Base Address:** Once it identifies the correct DLL (using ``UNICODE_STRING FullDllName``), the loader gets the ``PVOID DllBase`` from the ``_LDR_DATA_TABLE_ENTRY``.

2. Syscall Resolution
^^^^^^^^^^^^^^^^^^^^^

After finding the DLL base address, the loader reads the Export Address Table (EAT) of the PE file.

.. tip:: 
   The steps below explain how we move through the PE file. For a complete guide on the PE File format, I recommend `0xRick's Blog <https://0xrick.github.io/win-internals/pe2/>`_.

1. **Bypass the** `DOS headers <https://0xrick.github.io/win-internals/pe3/>`_ by reading the 4-byte value at offset ``0x3C``.
2. **Find the Optional Header:** From ``NtHeaders``, we go to the ``IMAGE_OPTIONAL_HEADER64``.
3. **Access Data Directories:** Inside the Optional Header, we look for ``IMAGE_DATA_DIRECTORY DataDirectory``.
4. **Read the Export Table:** We calculate the offset from ``DataDirectory[0]`` to land at the `Export Address Table (EAT) <https://ferreirasc.github.io/PE-Export-Address-Table/>`_.
5. **Read EAT Arrays:** We look at three arrays to find the SSNs:
   
   * ``AddressOfFunctions``
   * ``AddressOfNames``
   * ``AddressOfNameOrdinals``

6. **The "Gate" Check (Tartarus Gate):**
   
   * We calculate where the function is in memory.
   * **Hook Check:** We check the first few bytes. If the code starts with a ``jmp`` (which means it is hooked), we do not use it.
   * **Neighbor Scan:** We scan memory 32 bytes up and down to find a "clean" neighbor.
   * **SSN Calculation:** Once we find a clean neighbor, we calculate the SSN of our target function.

3. Syscall Execution
^^^^^^^^^^^^^^^^^^^^

After we have the SSN, we execute it using a custom assembly stub.

1. **ABI Compliance:** We follow the `Windows x64 calling convention <https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170>`_.
2. **Register Adjustment:** The ``syscall`` instruction overwrites ``rcx`` (it saves ``rip`` to ``rcx``). Because of this, we must move the first argument from ``rcx`` to ``r10`` before we run the command.
3. **Execution:** We run the ``syscall`` instruction.

Required Functions for Shellcode
--------------------------------

Using the **Tartarus Gate** technique described above, the beacon dynamically finds the System Service Numbers (SSNs) for four specific functions:

* ``NtAllocateVirtualMemory``: Allocates a new space in memory.
* ``NtWriteVirtualMemory``: Writes payload data into the allocated memory.
* ``NtProtectVirtualMemory``: Changes permissions to "Read/Execute" (RX) to avoid DEP.
* ``NtCreateThreadEx``: Executes the shellcode in a separate thread.

x64 WinINet Stager (PoC)
------------------------

.. image:: https://img.shields.io/badge/Language-MASM_x64-red
   :alt: Language
.. image:: https://img.shields.io/badge/Platform-Windows-0078D6
   :alt: Platform
.. image:: https://img.shields.io/badge/Technique-Shellcode_Style-yellow
   :alt: Technique

The source code for this is inside ``httpRequestSenderShellcode.asm``.

This is a pure x64 Assembly program that sends an HTTP POST request. It is a Proof-of-Concept (PoC) that shows how to use Windows APIs (``WinINet``) without using standard imports or the ``.data`` section.

Key Features
^^^^^^^^^^^^

* **No Static Imports:** The program has an empty Import Address Table (IAT).
* **Manual PEB Walk:** It finds ``kernel32.dll`` by reading the Process Environment Block (PEB).
* **Stack Strings:** All strings (like DLL names, function names) are built on the stack while the program runs.

Disclaimer
----------

.. warning::
   This software is provided for educational purposes only. It demonstrates operating system internals and modern evasion techniques. The author is not responsible for any misuse of this code.
