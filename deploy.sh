if ! az account show > /dev/null 2>&1; then
  az login
fi
az storage blob delete-batch -s '$web' --account-name sepelinpotkija
az storage blob upload-batch -d '$web' --account-name sepelinpotkija -s ./build
az cdn endpoint purge --resource-group sepelinpotkija --profile-name sepelinpotkija --name sepelinpotkija --content-paths '/index.html' '/ratainfo.json'