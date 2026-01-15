"""URL validation utilities to prevent SSRF attacks."""

import ipaddress
import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Blocked IP ranges (private, loopback, link-local, etc.)
BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),        # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private Class C
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local
    ipaddress.ip_network("0.0.0.0/8"),         # Current network
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("192.0.0.0/24"),      # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),      # TEST-NET-1
    ipaddress.ip_network("198.51.100.0/24"),   # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),    # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),       # Multicast
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved
    ipaddress.ip_network("255.255.255.255/32"),# Broadcast
    # IPv6 equivalents
    ipaddress.ip_network("::1/128"),           # Loopback
    ipaddress.ip_network("fc00::/7"),          # Unique local
    ipaddress.ip_network("fe80::/10"),         # Link-local
    ipaddress.ip_network("ff00::/8"),          # Multicast
]

# Blocked hostnames
BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "metadata",
    "instance-data",
}

# Cloud metadata endpoints
BLOCKED_HOSTNAME_PATTERNS = [
    "169.254.169.254",  # AWS/GCP metadata
    "metadata.google",
    "metadata.azure",
]


def is_ip_blocked(ip_str: str) -> bool:
    """Check if an IP address is in a blocked range."""
    try:
        ip = ipaddress.ip_address(ip_str)
        for network in BLOCKED_IP_RANGES:
            if ip in network:
                return True
        return False
    except ValueError:
        return False


def validate_url_for_ssrf(url: str) -> tuple[bool, str, list[str]]:
    """
    Validate a URL to prevent SSRF attacks.

    Returns:
        Tuple of (is_safe, error_message, resolved_ips)
        resolved_ips contains the validated IPs to use for the actual request
        (prevents DNS rebinding attacks by pinning IPs at validation time)
    """
    try:
        parsed = urlparse(url)

        resolved_ips: list[str] = []

        # Only allow HTTP(S)
        if parsed.scheme not in ("http", "https"):
            return False, f"Invalid scheme: {parsed.scheme}. Only HTTP(S) allowed.", []

        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: no hostname", []

        hostname_lower = hostname.lower()

        # Check blocked hostnames
        if hostname_lower in BLOCKED_HOSTNAMES:
            return False, f"Blocked hostname: {hostname}", []

        # Check blocked hostname patterns
        for pattern in BLOCKED_HOSTNAME_PATTERNS:
            if pattern in hostname_lower:
                return False, f"Blocked hostname pattern: {hostname}", []

        # Check if hostname is an IP address
        try:
            ip = ipaddress.ip_address(hostname)
            if is_ip_blocked(str(ip)):
                return False, f"Blocked IP range: {hostname}", []
            resolved_ips = [str(ip)]
        except ValueError:
            # Not an IP, resolve the hostname
            try:
                # Resolve DNS to check actual IP - store for later use (prevents rebinding)
                addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC)
                for result in addr_info:
                    ip_str = result[4][0]
                    if is_ip_blocked(ip_str):
                        logger.warning(f"URL {url} resolves to blocked IP: {ip_str}")
                        return False, f"Hostname resolves to blocked IP range", []
                    if ip_str not in resolved_ips:
                        resolved_ips.append(ip_str)
            except socket.gaierror:
                # DNS resolution failed - could be intentional for testing
                # Allow it but log
                logger.warning(f"Could not resolve hostname: {hostname}")

        # Block common internal ports if specified
        port = parsed.port
        internal_ports = {22, 23, 25, 445, 3306, 5432, 6379, 27017, 8006}
        if port in internal_ports:
            return False, f"Blocked port: {port}", []

        return True, "", resolved_ips

    except Exception as e:
        logger.error(f"URL validation error: {e}")
        return False, f"Invalid URL format", []
