docker build -t tcpdump - <<EOF
FROM alpine:3.7
RUN apk add --no-cache tcpdump
ENTRYPOINT ["tcpdump"]
EOF