date="$(date)"
hash=$(echo $date | sha256sum | cut -d " " -f 1 )
aws s3 --endpoint-url=https://storage.yandexcloud.net rm $1 --recursive
aws s3 --endpoint-url=https://storage.yandexcloud.net cp ./telegram/ui/build $1 --recursive
