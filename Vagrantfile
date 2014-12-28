# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "hashicorp/precise32"
  config.vm.provision :shell, path: "test/bootstrap.sh"
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
    v.cpus = 1
  end
end
